import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { AcceptableRoutes, ROUTES } from "./constants";

/**
 * Sets up deep link handling for the application
 * @param navigate - The navigation function from useNavigate hook
 */
export const setupDeepLinkHandler = async (
  navigate: (options: { to: string; search?: Record<string, any> }) => void
) => {
  try {
    await onOpenUrl((urls) => {
      console.log("Deep link received:", urls);

      const url = urls[0];
      if (!url) return;

      try {
        // Parse the URL to extract the path and parameters
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        console.log("Deep link path:", path); // Define valid routes that exist in your app
        const validRoutes = [
          ROUTES.ERROR,
          ROUTES.CALLBACK,
          ROUTES.LOGIN,
          ROUTES.DASHBOARD,
          ROUTES.NOT_FOUND,
          ROUTES.HOME,
        ];
        if (validRoutes.includes(path as AcceptableRoutes)) {
          if (path === ROUTES.ERROR) {
            const searchParams = urlObj.searchParams;
            navigate({
              to: ROUTES.ERROR,
              search: {
                error: searchParams.get("error") || "unknown",
                error_code: searchParams.get("error_code") || undefined,
                error_description:
                  searchParams.get("error_description") || "An error occurred",
              },
            });
          } else if (path === ROUTES.CALLBACK) {
            // Check if the URL contains error parameters
            const hashPart = url.split("#")[1];
            const searchPart = url.split("?")[1];
            const urlParams = new URLSearchParams(hashPart || searchPart || "");

            if (url.includes("error=")) {
              const errorType = urlParams.get("error");
              const errorCode = urlParams.get("error_code");
              const errorDescription = urlParams.get("error_description");

              // Redirect to error page with error details
              navigate({
                to: ROUTES.ERROR,
                search: {
                  error: errorType || "unknown",
                  ...(errorCode && { error_code: errorCode }),
                  error_description:
                    errorDescription ||
                    "An error occurred during authentication",
                },
              });
            } else {
              // No error, proceed to callback with all parameters
              const searchObj: Record<string, any> = {};
              urlParams.forEach((value, key) => {
                searchObj[key] = value;
              });

              navigate({
                to: ROUTES.CALLBACK,
                search: searchObj,
              });
            }
          } else {
            navigate({ to: path });
          }
        } else {
          // Route not found - redirect to error page          console.log("Invalid route detected:", path);
          navigate({
            to: ROUTES.NOT_FOUND,
          });
        }
      } catch (parseError) {
        // Invalid URL format - redirect to error page
        console.error("Failed to parse deep link URL:", parseError);
        navigate({
          to: ROUTES.ERROR,
          search: {
            error: "invalid_url",
            error_code: "400",
            error_description: "The deep link URL format is invalid",
          },
        });
      }
    });
  } catch (error) {
    console.error("Failed to set up deep link handler:", error);
  }
};

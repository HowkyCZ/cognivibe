import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { ROUTES } from "./constants";

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
        if (validRoutes.includes(path as any)) {
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
            navigate({ to: ROUTES.CALLBACK });
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

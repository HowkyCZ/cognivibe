import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { AcceptableRoutes, ROUTES } from "./constants";

/**
 * Validates and sanitizes URL parameters to prevent injection attacks
 */
const sanitizeUrlParam = (value: string | null): string | undefined => {
  if (!value || typeof value !== "string") return undefined;

  // Limit parameter length to prevent DoS
  if (value.length > 2000) return undefined;

  // Remove potentially dangerous characters
  const sanitized = value.replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, "");

  return sanitized.length > 0 ? sanitized : undefined;
};

/**
 * Validates deep link URL format and origin
 */
const validateDeepLinkUrl = (url: string): boolean => {
  // Check URL length to prevent DoS
  if (url.length > 4096) {
    console.warn("Deep link URL too long");
    return false;
  }

  // Validate protocol - only allow your app's custom protocol
  if (!url.startsWith("cognivibe://")) {
    console.warn("Invalid deep link protocol:", url.substring(0, 20));
    return false;
  }

  // Additional validation for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /on\w+=/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
    console.warn("Suspicious content detected in deep link");
    return false;
  }

  return true;
};

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

      // Validate URL before processing
      if (!validateDeepLinkUrl(url)) {
        navigate({
          to: ROUTES.ERROR,
          search: {
            error: "invalid_url",
            error_code: "400",
            error_description: "The deep link URL is not valid",
          },
        });
        return;
      }

      try {
        // Parse the URL to extract the path and parameters
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        console.log("Deep link path:", path);

        // Define valid routes that exist in your app
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
                error: sanitizeUrlParam(searchParams.get("error")) || "unknown",
                error_code:
                  sanitizeUrlParam(searchParams.get("error_code")) || undefined,
                error_description:
                  sanitizeUrlParam(searchParams.get("error_description")) ||
                  "An error occurred",
              },
            });
          } else if (path === ROUTES.CALLBACK) {
            // Check if the URL contains error parameters
            const hashPart = url.split("#")[1];
            const searchPart = url.split("?")[1];
            const urlParams = new URLSearchParams(hashPart || searchPart || "");

            if (url.includes("error=")) {
              const errorType = sanitizeUrlParam(urlParams.get("error"));
              const errorCode = sanitizeUrlParam(urlParams.get("error_code"));
              const errorDescription = sanitizeUrlParam(
                urlParams.get("error_description")
              );

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
              // No error, proceed to callback with sanitized parameters
              const searchObj: Record<string, any> = {};

              // Define allowed callback parameters to prevent parameter pollution
              const allowedParams = [
                "access_token",
                "refresh_token",
                "token_type",
                "expires_in",
                "state",
                "code",
              ];

              urlParams.forEach((value, key) => {
                if (allowedParams.includes(key)) {
                  const sanitizedValue = sanitizeUrlParam(value);
                  if (sanitizedValue) {
                    searchObj[key] = sanitizedValue;
                  }
                }
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
          // Route not found - redirect to error page
          console.log("Invalid route detected:", path);
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

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
 * Extracts URL parameters from hash or search parts
 */
const extractUrlParams = (url: string): URLSearchParams => {
  const hashPart = url.split("#")[1];
  const searchPart = url.split("?")[1];
  return new URLSearchParams(hashPart || searchPart || "");
};

/**
 * Navigates to error page with sanitized parameters
 */
const navigateToError = (
  navigate: (options: { to: string; search?: Record<string, any> }) => void,
  urlParams: URLSearchParams,
  defaultDescription: string = "An error occurred"
) => {
  const errorCode = sanitizeUrlParam(urlParams.get("error_code"));
  navigate({
    to: ROUTES.ERROR,
    search: {
      error: sanitizeUrlParam(urlParams.get("error")) || "unknown",
      ...(errorCode && { error_code: errorCode }),
      error_description:
        sanitizeUrlParam(urlParams.get("error_description")) ||
        defaultDescription,
    },
  });
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

        // For custom protocols, combine host and pathname to get the full path
        const fullPath = urlObj.hostname
          ? `/${urlObj.hostname}${urlObj.pathname}`
          : urlObj.pathname;

        console.log("Deep link path:", fullPath);

        // Use ROUTES object values for validation
        const validRoutes = Object.values(ROUTES);

        if (!validRoutes.includes(fullPath as AcceptableRoutes)) {
          console.log("Invalid route detected:", fullPath);
          navigate({ to: ROUTES.NOT_FOUND });
          return;
        }

        // Handle specific routes
        if (fullPath === ROUTES.ERROR) {
          navigateToError(navigate, urlObj.searchParams, "An error occurred");
        } else if (fullPath === ROUTES.CALLBACK) {
          const urlParams = extractUrlParams(url);

          if (url.includes("error=")) {
            navigateToError(
              navigate,
              urlParams,
              "An error occurred during authentication"
            );
          } else {
            // No error, proceed to callback with sanitized parameters
            const allowedParams = [
              "access_token",
              "refresh_token",
              "token_type",
              "expires_in",
              "state",
              "code",
            ];

            const searchObj: Record<string, any> = {};

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
          navigate({ to: fullPath });
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

import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppTemplate } from "../components";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";

export const Route = createRootRoute({
  component: () => {
    const navigate = useNavigate();

    useEffect(() => {
      const setupDeepLinkHandler = async () => {
        try {
          await onOpenUrl((urls) => {
            console.log("Deep link received:", urls);

            const url = urls[0];
            if (!url) return;

            try {
              // Parse the URL to extract the path and parameters
              const urlObj = new URL(url);
              const path = urlObj.pathname;

              console.log("Deep link path:", path);

              // Define valid routes that exist in your app
              const validRoutes = [
                "/auth/error",
                "/auth/callback",
                "/auth/login",
                "/dashboard",
                "/404",
                "/",
              ];

              if (validRoutes.includes(path)) {
                if (path === "/auth/error") {
                  const searchParams = urlObj.searchParams;
                  navigate({
                    to: "/auth/error",
                    search: {
                      error: searchParams.get("error") || "unknown",
                      error_code: searchParams.get("error_code") || undefined,
                      error_description:
                        searchParams.get("error_description") ||
                        "An error occurred",
                    },
                  });
                } else if (path === "/auth/callback") {
                  navigate({ to: "/auth/callback" });
                } else {
                  navigate({ to: path });
                }
              } else {
                // Route not found - redirect to error page
                console.log("Invalid route detected:", path);
                navigate({
                  to: "/404",
                });
              }
            } catch (parseError) {
              // Invalid URL format - redirect to error page
              console.error("Failed to parse deep link URL:", parseError);
              navigate({
                to: "/auth/error",
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

      setupDeepLinkHandler();
    }, [navigate]);

    return (
      <AppTemplate>
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </AppTemplate>
    );
  },
});

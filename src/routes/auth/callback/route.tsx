import { createFileRoute, useRouter } from "@tanstack/react-router";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { createSupabaseClient } from "../../../utils/createSupabaseClient";
import { useEffect } from "react";
import { SpinnerPage } from "../../../components/pages";
import { ROUTES } from "../../../utils/constants";

export const Route = createFileRoute(ROUTES.CALLBACK)({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createSupabaseClient();

        // Listen for deep links
        await onOpenUrl((urls) => {
          console.log("deep link:", urls);

          const url = urls[0];
          if (!url) return;

          const hashPart = url.split("#")[1];
          const searchPart = url.split("?")[1];
          const urlParams = new URLSearchParams(hashPart || searchPart || "");

          // Check if the URL contains error parameters
          if (url.includes("error=")) {
            const errorType = urlParams.get("error");
            const errorCode = urlParams.get("error_code");
            const errorDescription = urlParams.get("error_description");

            // Redirect to error page with error details
            router.navigate({
              to: ROUTES.ERROR,
              search: {
                error: errorType || "unknown",
                ...(errorCode && { error_code: errorCode }),
                error_description:
                  errorDescription || "An error occurred during authentication",
              } as any,
            });
            return;
          }

          // Check if URL contains success tokens
          if (url.includes("access_token") && url.includes("refresh_token")) {
            const accessToken = urlParams.get("access_token");
            const refreshToken = urlParams.get("refresh_token");

            if (accessToken && refreshToken) {
              // Set the session with the tokens
              supabase.auth
                .setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                })
                .then(() => {
                  // Redirect to home after successful authentication
                  router.navigate({ to: ROUTES.HOME });
                })
                .catch((error) => {
                  console.error("Error setting session:", error);
                  router.navigate({
                    to: ROUTES.ERROR,
                    search: {
                      error: "session_error",
                      error_description:
                        "Failed to set authentication session.",
                    } as any,
                  });
                });
              return;
            }
          }
        });

        // If no tokens or errors in deep link, check existing session
        const { data, error } = await supabase.auth.getSession();
        console.log("Current session data:", data);

        if (error) {
          console.log("Error fetching session:", error);
          // Redirect to error page for session errors
          router.navigate({
            to: ROUTES.ERROR,
            search: {
              error: "session_error",
              error_description:
                "Failed to authenticate. Please try logging in again.",
            } as any,
          });
        } else if (data.session) {
          // Success - redirect to home
          router.navigate({ to: ROUTES.HOME });
        } else {
          // No session found
          router.navigate({
            to: ROUTES.ERROR,
            search: {
              error: "no_session",
              error_description:
                "No valid session found. Please try logging in again.",
            } as any,
          });
        }
      } catch (err) {
        console.error("Callback error:", err);
        router.navigate({
          to: ROUTES.ERROR,
          search: {
            error: "unexpected_error",
            error_description:
              "An unexpected error occurred. Please try again.",
          } as any,
        });
      }
    };

    handleCallback();
  }, [router]);

  return <SpinnerPage />;
}

import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { createSupabaseClient } from "../../../utils/createSupabaseClient";
import { useEffect } from "react";
import { SpinnerPage } from "../../../components/pages";
import { ROUTES } from "../../../utils/constants";
import { invoke } from "@tauri-apps/api/core";

export const Route = createFileRoute(ROUTES.CALLBACK)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      access_token: (search.access_token as string) || undefined,
      refresh_token: (search.refresh_token as string) || undefined,
      error: (search.error as string) || undefined,
      error_code: (search.error_code as string) || undefined,
      error_description: (search.error_description as string) || undefined,
    };
  },
});

function RouteComponent() {
  const router = useRouter();
  const searchParams = useSearch({ from: ROUTES.CALLBACK });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createSupabaseClient();

        // Check if URL contains success tokens
        const accessToken = searchParams.access_token;
        const refreshToken = searchParams.refresh_token;

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            .then(async () => {
              // Get the session to send to backend
              const {
                data: { session },
              } = await supabase.auth.getSession();

              // Set session in Rust backend
              if (session) {
                await invoke("set_user_session", {
                  session: {
                    user_id: session.user.id,
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                  },
                });
              }

              // Redirect to home after successful authentication
              router.navigate({ to: ROUTES.HOME });
            })
            .catch((error) => {
              console.error("Failed to set session:", error);
              router.navigate({
                to: ROUTES.ERROR,
                search: {
                  error: "session_error",
                  error_description: "Failed to set authentication session.",
                },
              });
            });
          return;
        }

        // If no tokens or errors in deep link, check existing session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // Redirect to error page for session errors
          router.navigate({
            to: ROUTES.ERROR,
            search: {
              error: "session_error",
              error_description:
                "Failed to authenticate. Please try logging in again.",
            },
          });
        } else if (data.session) {
          // Set session in Rust backend
          await invoke("set_user_session", {
            session: {
              user_id: data.session.user.id,
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            },
          });

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
            },
          });
        }
      } catch (err) {
        router.navigate({
          to: ROUTES.ERROR,
          search: {
            error: "unexpected_error",
            error_description:
              "An unexpected error occurred. Please try again.",
          },
        });
      }
    };

    handleCallback();
  }, [router]);

  return <SpinnerPage />;
}

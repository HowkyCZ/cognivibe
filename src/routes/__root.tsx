import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppTemplate } from "../components";
import { setupDeepLinkHandler } from "../utils/deepLinkHandler";
import { isDevMode } from "../utils/constants";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useMacOSPermissions } from "../hooks";
import { useAuth } from "../hooks/useAuth";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export const Route = createRootRoute({
  component: () => {
    const navigate = useNavigate();
    const { session } = useAuth();

    useEffect(() => {
      setupDeepLinkHandler(navigate);
    }, []);

    // Global event listener for session data requests from backend
    useEffect(() => {
      const setupSessionListener = async () => {
        const unlisten = await listen("request-session-data", async () => {
          console.log("📨 Backend requested session data");

          if (session) {
            try {
              await invoke("store_session_data", {
                sessionData: {
                  user_id: session.user.id,
                  access_token: session.access_token,
                  refresh_token: session.refresh_token || null,
                },
              });
              console.log("✅ Session data sent to backend");
            } catch (error) {
              console.error("❌ Failed to send session data to backend:", error);
            }
          } else {
            console.warn("⚠️ No session available to send to backend");
          }
        });

        return unlisten;
      };

      let unlistenFn: (() => void) | null = null;

      setupSessionListener().then((fn) => {
        unlistenFn = fn;
      });

      return () => {
        if (unlistenFn) {
          unlistenFn();
        }
      };
    }, [session]);

    useMacOSPermissions();

    return (
      <AppTemplate>
        <Outlet />
        {isDevMode && <TanStackRouterDevtools />}
      </AppTemplate>
    );
  },
});

import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";
import { HeroUIProvider } from "@heroui/react";
import { AppTemplate, PermissionsWelcomeModal } from "../components";
import BreakManager from "../components/BreakManager";
import { setupDeepLinkHandler } from "../utils/deepLinkHandler";
import { isDevMode } from "../utils/constants";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { runMacOSPermissionChecks } from "../hooks/useMacOSPermissions";
import { useAuth } from "../hooks/useAuth";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const PERMISSIONS_ACKNOWLEDGED_KEY = "cognivibe_permissions_acknowledged";

/** Routes that render in their own popup/overlay windows. */
const POPUP_ROUTES = ["/break", "/tour"];

export const Route = createRootRoute({
  component: () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [showPermissionsModal, setShowPermissionsModal] = useState<
      boolean | null
    >(null);

    useEffect(() => {
      setupDeepLinkHandler(navigate);
    }, []);

    useEffect(() => {
      const checkPermissionsModal = async () => {
        const p = await platform();
        const alreadyAcknowledged = localStorage.getItem(PERMISSIONS_ACKNOWLEDGED_KEY) === "true";
        
        // Only show modal on macOS if not already acknowledged
        setShowPermissionsModal(p === "macos" && !alreadyAcknowledged);
      };
      checkPermissionsModal();
    }, []);

    useEffect(() => {
      if (showPermissionsModal === false) {
        runMacOSPermissionChecks();
      }
    }, [showPermissionsModal]);

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

    const handlePermissionsModalClose = (isOpen: boolean) => {
      if (!isOpen) {
        // Save acknowledgment to localStorage so modal doesn't show again
        localStorage.setItem(PERMISSIONS_ACKNOWLEDGED_KEY, "true");
        runMacOSPermissionChecks();
        setShowPermissionsModal(false);
      }
    };

    // Check if we're in a popup window (break/focus overlays)
    const isPopupWindow = POPUP_ROUTES.some((r) =>
      window.location.pathname.startsWith(r)
    );

    // Popup windows: bare HeroUI only — no AppTemplate, no useUpdater,
    // no ToastProvider, no UpdateModal. This prevents the updater from
    // freezing the popup's JS event loop and making buttons unresponsive.
    if (isPopupWindow) {
      return (
        <HeroUIProvider>
          <Outlet />
        </HeroUIProvider>
      );
    }

    return (
      <AppTemplate>
        <Outlet />
        <BreakManager />
        {showPermissionsModal === true && (
          <PermissionsWelcomeModal
            isOpen
            onOpenChange={handlePermissionsModalClose}
          />
        )}
        {isDevMode && <TanStackRouterDevtools />}
      </AppTemplate>
    );
  },
});

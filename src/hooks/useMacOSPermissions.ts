import { useEffect } from "react";
import { platform } from "@tauri-apps/plugin-os";
import {
  checkAccessibilityPermission,
  checkInputMonitoringPermission,
  requestAccessibilityPermission,
  requestInputMonitoringPermission,
} from "tauri-plugin-macos-permissions-api";

/**
 * Custom hook to handle macOS permissions checking and requesting, Windows and Linux do not require this.
 * Automatically checks and requests accessibility and input monitoring permissions on macOS
 */
export const useMacOSPermissions = () => {
  useEffect(() => {
    const checkMacOSPermissions = async () => {
      try {
        const currentPlatform = await platform();
        if (currentPlatform === "macos") {
          // Check and request accessibility permission
          const isAccessibilityEnabled = await checkAccessibilityPermission();
          if (!isAccessibilityEnabled) {
            await requestAccessibilityPermission();
          }

          // Check and request input monitoring permission
          const isInputMonitoringEnabled =
            await checkInputMonitoringPermission();
          if (!isInputMonitoringEnabled) {
            await requestInputMonitoringPermission();
          }
        }
      } catch (error) {
        console.error("Error checking macOS permissions:", error);
      }
    };

    checkMacOSPermissions();
  }, []);
};

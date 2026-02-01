import { useEffect } from "react";
import { platform } from "@tauri-apps/plugin-os";
import {
  checkAccessibilityPermission,
  checkInputMonitoringPermission,
  requestAccessibilityPermission,
  requestInputMonitoringPermission,
  checkScreenRecordingPermission,
  requestScreenRecordingPermission,
} from "tauri-plugin-macos-permissions-api";

/**
 * Runs macOS permission checks and requests (accessibility, input monitoring, screen recording).
 * No-op on non-macOS. Call this when the user has acknowledged the permissions welcome modal
 * or on non-macOS on mount.
 */
export async function runMacOSPermissionChecks(): Promise<void> {
  try {
    const currentPlatform = await platform();
    if (currentPlatform === "macos") {
      const isAccessibilityEnabled = await checkAccessibilityPermission();
      if (!isAccessibilityEnabled) {
        await requestAccessibilityPermission();
      }

      const isInputMonitoringEnabled =
        await checkInputMonitoringPermission();
      if (!isInputMonitoringEnabled) {
        await requestInputMonitoringPermission();
      }

      const isScreenRecordingEnabled =
        await checkScreenRecordingPermission();
      if (!isScreenRecordingEnabled) {
        await requestScreenRecordingPermission();
      }
    }
  } catch (error) {
    console.error("Error checking macOS permissions:", error);
  }
}

interface UseMacOSPermissionsOptions {
  /** When true (default), run permission checks on mount. When false, do nothing on mount. */
  runImmediately?: boolean;
}

/**
 * Custom hook to handle macOS permissions checking and requesting, Windows and Linux do not require this.
 * When runImmediately is true, automatically checks and requests permissions on mount.
 */
export const useMacOSPermissions = (
  options: UseMacOSPermissionsOptions = {}
) => {
  const { runImmediately = true } = options;

  useEffect(() => {
    if (runImmediately) {
      runMacOSPermissionChecks();
    }
  }, [runImmediately]);
};

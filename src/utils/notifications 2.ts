import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";

/**
 * Ensures notification permission is granted
 * @returns true if permission is granted, false otherwise
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const permissionGranted = await isPermissionGranted();
    if (permissionGranted) {
      return true;
    }

    const permission = await requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("[NOTIFICATIONS] Failed to check/request permission:", error);
    return false;
  }
}

/**
 * Sends a push notification with the given title and body
 * @param title - Notification title
 * @param body - Notification body text
 * @returns true if notification was sent successfully, false otherwise
 */
export async function sendPushNotification(
  title: string,
  body: string
): Promise<boolean> {
  try {
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) {
      console.warn("[NOTIFICATIONS] Permission not granted, skipping notification");
      return false;
    }

    await sendNotification({
      title,
      body,
    });

    console.log("[NOTIFICATIONS] Notification sent:", { title, body });
    return true;
  } catch (error) {
    console.error("[NOTIFICATIONS] Failed to send notification:", error);
    return false;
  }
}

/**
 * Sends a notification with a random chance
 * @param title - Notification title
 * @param body - Notification body text
 * @param chance - Probability of sending (0.0 to 1.0)
 * @returns true if notification was sent, false if skipped or failed
 */
export async function sendPushNotificationWithChance(
  title: string,
  body: string,
  chance: number
): Promise<boolean> {
  if (Math.random() > chance) {
    console.log(`[NOTIFICATIONS] Skipped notification (${(chance * 100).toFixed(0)}% chance)`);
    return false;
  }

  return sendPushNotification(title, body);
}

import { openPath } from "@tauri-apps/plugin-opener";

/**
 * Opens an external URL in the default browser using the base website URL from environment
 * @param path - The path to append to the base website URL (e.g., "/privacy", "/terms")
 */
export const openExternalUrl = async (path: string): Promise<void> => {
  try {
    const baseUrl = import.meta.env.VITE_WEBSITE_URL;
    const fullUrl = `${baseUrl}${path}`;
    await openPath(fullUrl);
  } catch (error) {
    console.error("Failed to open external URL:", error);
    throw error;
  }
};

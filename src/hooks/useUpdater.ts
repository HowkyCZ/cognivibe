import { useState, useEffect } from "react";
import { check, Update, DownloadEvent } from "@tauri-apps/plugin-updater";

interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

interface UseUpdaterReturn {
  isUpdateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  error: string | null;
  downloadAndInstall: (
    onProgress: (event: DownloadEvent) => void
  ) => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

export const useUpdater = (): UseUpdaterReturn => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateInstance, setUpdateInstance] = useState<Update | null>(null);

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      setError(null);

      console.log("Checking for updates...");
      const update = await check();

      if (update) {
        console.log(`Update found: ${update.version} from ${update.date}`);
        setUpdateInfo({
          version: update.version,
          date: update.date || "",
          body: update.body || "",
        });
        setUpdateInstance(update);
        setIsUpdateAvailable(true);
      } else {
        console.log("No updates available");
        setIsUpdateAvailable(false);
        setUpdateInfo(null);
        setUpdateInstance(null);
      }
    } catch (err) {
      console.error("Error checking for updates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to check for updates"
      );
      setIsUpdateAvailable(false);
      setUpdateInfo(null);
      setUpdateInstance(null);
    } finally {
      setIsChecking(false);
    }
  };

  const downloadAndInstall = async (
    onProgress: (event: DownloadEvent) => void
  ) => {
    if (!updateInstance) {
      throw new Error("No update available to install");
    }

    try {
      console.log("Starting download and install...");
      await updateInstance.downloadAndInstall(onProgress);
      console.log("Update installed successfully");
    } catch (err) {
      console.error("Error downloading and installing update:", err);
      throw err;
    }
  };

  // Check for updates on component mount
  useEffect(() => {
    // Check for updates after a short delay to allow app to fully load
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Check for updates periodically (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(
      () => {
        checkForUpdates();
      },
      30 * 60 * 1000
    ); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    isUpdateAvailable,
    updateInfo,
    isChecking,
    error,
    downloadAndInstall,
    checkForUpdates,
  };
};

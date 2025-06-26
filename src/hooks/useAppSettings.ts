import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";

export interface AppSettings {
  start_on_boot: boolean;
  auto_start_measuring: boolean;
}

interface UseAppSettingsReturn {
  settings: AppSettings | null;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useAppSettings = (): UseAppSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load settings from backend
      const backendSettings = await invoke<AppSettings>("get_settings");

      // Check actual autostart status from system
      const autostartEnabled = await isEnabled();

      // Combine backend settings with actual autostart status
      const loadedSettings: AppSettings = {
        ...backendSettings,
        start_on_boot: autostartEnabled,
      };

      setSettings(loadedSettings);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load settings";
      setError(errorMessage);
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };
  const updateSettings = async (newSettings: AppSettings) => {
    try {
      setLoading(true);
      setError(null);

      // Handle autostart setting if it changed
      if (settings && newSettings.start_on_boot !== settings.start_on_boot) {
        if (newSettings.start_on_boot) {
          await enable();
        } else {
          await disable();
        }
      }

      // Update backend settings
      await invoke("update_settings", { settings: newSettings });
      setSettings(newSettings);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update settings";
      setError(errorMessage);
      console.error("Failed to update settings:", err);
      throw err; // Re-throw so calling code can handle the error
    } finally {
      setLoading(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    updateSettings,
    loading,
    error,
  };
};

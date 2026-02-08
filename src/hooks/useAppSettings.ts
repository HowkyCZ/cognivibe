import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
  disable as disableAutostart,
} from "@tauri-apps/plugin-autostart";

export interface AppSettings {
  should_start_on_boot: boolean;
  should_autostart_measuring: boolean;
  break_nudge_enabled: boolean;
  break_interval_minutes: number;
  break_duration_seconds: number;
  break_score_threshold: number;
  break_auto_pause_categories: string[];
  focus_nudge_enabled: boolean;
  focus_nudge_sensitivity: number;
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
      const backendSettings = await invoke<AppSettings>("get_settings_state");

      // Check actual autostart status from system
      const autostartEnabled = await isAutostartEnabled();

      // Combine backend settings with actual autostart status
      const loadedSettings: AppSettings = {
        ...backendSettings,
        should_start_on_boot: autostartEnabled,
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
      if (
        settings &&
        newSettings.should_start_on_boot !== settings.should_start_on_boot
      ) {
        if (newSettings.should_start_on_boot) {
          await enableAutostart();
        } else {
          await disableAutostart();
        }
      }

      // Update backend settings
      await invoke("update_settings_cmd", { settings: newSettings });
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

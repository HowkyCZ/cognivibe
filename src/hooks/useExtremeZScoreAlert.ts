import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface ExtremeZScoreAlert {
  cognitive_score_id: number;
  metric_name: string;
  direction: string;
  z_score: number;
}

interface UseExtremeZScoreAlertReturn {
  alert: ExtremeZScoreAlert | null;
  clearAlert: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook to manage extreme Z-score alerts from the Rust backend
 * - Polls the Tauri command periodically
 * - Listens for extreme-zscore-alert events
 * - Auto-expires alerts after 5 minutes (handled by backend)
 */
export function useExtremeZScoreAlert(): UseExtremeZScoreAlertReturn {
  const [alert, setAlert] = useState<ExtremeZScoreAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch alert from Rust backend
  const fetchAlert = useCallback(async () => {
    try {
      const result = await invoke<ExtremeZScoreAlert | null>(
        "get_extreme_zscore_alert"
      );
      setAlert(result);
    } catch (error) {
      console.error("[ZSCORE_ALERT] Failed to fetch alert:", error);
      setAlert(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear alert in Rust backend
  const clearAlert = useCallback(async () => {
    try {
      await invoke("clear_extreme_zscore_alert");
      setAlert(null);
      console.log("[ZSCORE_ALERT] Alert cleared");
    } catch (error) {
      console.error("[ZSCORE_ALERT] Failed to clear alert:", error);
    }
  }, []);

  // Initial fetch and periodic polling
  // OPTIMIZATION: Only poll when page is visible and increase interval to 60s
  useEffect(() => {
    // Initial fetch
    fetchAlert();

    // Don't poll if page is hidden
    if (document.hidden) {
      return;
    }

    // Poll every 60 seconds (optimized from 30s)
    const pollInterval = setInterval(() => {
      // Only fetch if page is still visible
      if (!document.hidden) {
        fetchAlert();
      }
    }, 60000);

    // Handle visibility changes - restart polling when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, fetch immediately
        fetchAlert();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchAlert]);

  // Listen for extreme Z-score events from Rust backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen<ExtremeZScoreAlert>(
          "extreme-zscore-alert",
          (event) => {
            console.log("[ZSCORE_ALERT] Received alert event:", event.payload);
            setAlert(event.payload);
          }
        );
      } catch (error) {
        console.error("[ZSCORE_ALERT] Failed to setup event listener:", error);
      }
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return { alert, clearAlert, isLoading };
}

export default useExtremeZScoreAlert;

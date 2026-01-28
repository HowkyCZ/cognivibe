import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseMeasuringReturn {
  isMeasuring: boolean;
  toggleMeasuring: () => Promise<void>;
  syncState: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useMeasuring = (): UseMeasuringReturn => {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncState = async () => {
    console.log("[USE_MEASURING] Syncing measuring state...");
    try {
      setLoading(true);
      setError(null);
      const backendState = await invoke<boolean>("get_measuring_state");
      console.log("[USE_MEASURING] ✅ Measuring state synced:", backendState);
      setIsMeasuring(backendState);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sync measuring state";
      setError(errorMessage);
      console.error("[USE_MEASURING] ❌ Failed to sync measuring state:", err);
      if (err instanceof Error) {
        console.error("[USE_MEASURING] Error details:", {
          message: err.message,
          stack: err.stack,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const toggleMeasuring = async () => {
    console.log("[USE_MEASURING] Toggling measuring state, current:", isMeasuring);
    try {
      setLoading(true);
      setError(null);
      const newState = await invoke<boolean>("toggle_measuring");
      console.log("[USE_MEASURING] ✅ Measuring toggled, new state:", newState);
      setIsMeasuring(newState);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to toggle measuring";
      setError(errorMessage);
      console.error("[USE_MEASURING] ❌ Failed to toggle measuring:", err);
      if (err instanceof Error) {
        console.error("[USE_MEASURING] Error details:", {
          message: err.message,
          stack: err.stack,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  // Sync state on mount
  useEffect(() => {
    syncState();
  }, []);
  return {
    isMeasuring,
    toggleMeasuring,
    syncState,
    loading,
    error,
  };
};

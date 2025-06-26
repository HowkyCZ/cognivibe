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
    try {
      setLoading(true);
      setError(null);
      const backendState = await invoke<boolean>("get_measuring_state");
      setIsMeasuring(backendState);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sync measuring state";
      setError(errorMessage);
      console.error("Failed to sync measuring state:", err);
    } finally {
      setLoading(false);
    }
  };
  const toggleMeasuring = async () => {
    try {
      setLoading(true);
      setError(null);
      const newState = await invoke<boolean>("toggle_measuring");
      setIsMeasuring(newState);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to toggle measuring";
      setError(errorMessage);
      console.error("Failed to toggle measuring:", err);
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

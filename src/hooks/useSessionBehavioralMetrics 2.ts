import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "../utils/createSupabaseClient";

export interface SessionStats {
  typingSpeed: number; // chars/min
  windowSwitches: number;
  errorRate: number; // percentage
  clicks: number;
}

interface BehavioralMetricsRow {
  keyboard_key_downs_count: number;
  backspace_count: number | null;
  window_change_count: number | null;
  mouse_left_clicks_count: number;
  mouse_right_clicks_count: number;
  mouse_other_clicks_count: number;
  minute_timestamp: string;
}

const REFRESH_INTERVAL_MS = 30000; // Refresh every 30 seconds

export interface UseSessionBehavioralMetricsReturn {
  stats: SessionStats;
  loading: boolean;
  error: string | null;
}

export const useSessionBehavioralMetrics = (
  sessionId: string | null
): UseSessionBehavioralMetricsReturn => {
  const [stats, setStats] = useState<SessionStats>({
    typingSpeed: 0,
    windowSwitches: 0,
    errorRate: 0,
    clicks: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!sessionId) {
      setStats({
        typingSpeed: 0,
        windowSwitches: 0,
        errorRate: 0,
        clicks: 0,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createSupabaseClient();

      // Query behavioral_metrics_log filtered by session_id
      const { data, error: queryError } = await supabase
        .from("behavioral_metrics_log")
        .select(
          "keyboard_key_downs_count, backspace_count, window_change_count, mouse_left_clicks_count, mouse_right_clicks_count, mouse_other_clicks_count, minute_timestamp"
        )
        .eq("session_id", sessionId);

      if (queryError) {
        console.error(
          "[useSessionBehavioralMetrics] Query error:",
          queryError
        );
        setError(queryError.message);
        return;
      }

      if (!data || data.length === 0) {
        // No metrics yet for this session
        setStats({
          typingSpeed: 0,
          windowSwitches: 0,
          errorRate: 0,
          clicks: 0,
        });
        return;
      }

      // Calculate aggregated statistics
      const metrics = data as BehavioralMetricsRow[];

      let totalKeystrokes = 0;
      let totalBackspaces = 0;
      let totalWindowSwitches = 0;
      let totalClicks = 0;

      metrics.forEach((row) => {
        totalKeystrokes += row.keyboard_key_downs_count || 0;
        totalBackspaces += row.backspace_count ?? 0;
        totalWindowSwitches += row.window_change_count ?? 0;
        totalClicks +=
          (row.mouse_left_clicks_count || 0) +
          (row.mouse_right_clicks_count || 0) +
          (row.mouse_other_clicks_count || 0);
      });

      // Number of minutes = number of rows (each row is one minute)
      const minutes = metrics.length;

      // Calculate typing speed (chars/min)
      const typingSpeed = minutes > 0 ? Math.round(totalKeystrokes / minutes) : 0;

      // Calculate error rate (backspaces / keystrokes * 100)
      const errorRate =
        totalKeystrokes > 0
          ? Math.round((totalBackspaces / totalKeystrokes) * 100)
          : 0;

      setStats({
        typingSpeed,
        windowSwitches: totalWindowSwitches,
        errorRate,
        clicks: totalClicks,
      });

      console.log("[useSessionBehavioralMetrics] Stats calculated:", {
        sessionId,
        minutes,
        totalKeystrokes,
        totalBackspaces,
        totalWindowSwitches,
        totalClicks,
        typingSpeed,
        errorRate,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch session behavioral metrics";
      setError(errorMessage);
      console.error("[useSessionBehavioralMetrics] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Fetch on mount and when sessionId changes
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Refresh periodically while session is active
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId, fetchMetrics]);

  return {
    stats,
    loading,
    error,
  };
};

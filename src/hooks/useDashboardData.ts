import { useState, useEffect } from "react";
import { fetchBatchScores } from "../utils/batchScoresApi";
import { fetchSessions, SessionData } from "../utils/sessionsApi";
import { useAuth } from "./useAuth";
import type { CalendarDate } from "@internationalized/date";
import { Session } from "@supabase/supabase-js";

export interface CognitiveLoadDataPoint {
  timestamp: string;
  load: number;
  focus: number;
  strain: number;
  energy: number;
}

export interface MissingDataPoint {
  timestamp: string;
  score_total: number | null;
  score_focus: number | null;
  score_strain: number | null;
  score_energy: number | null;
}

export interface MetricData {
  title: string;
  value: number;
  color: "primary" | "secondary" | "danger" | "success" | "warning";
  description: string;
}

interface UseDashboardDataReturn {
  cognitiveLoadData: CognitiveLoadDataPoint[];
  missingData: MissingDataPoint[];
  metricsData: MetricData[];
  sessions: SessionData[];
  currentCognitiveLoad: number;
  maxLoad: number;
  avgLoad: number;
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  loading: boolean;
  error: string | null;
  session: Session | null;
}

export const useDashboardData = (
  selectedDate: CalendarDate
): UseDashboardDataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cognitiveLoadData, setCognitiveLoadData] = useState<
    CognitiveLoadDataPoint[]
  >([]);
  const [missingData, setMissingData] = useState<MissingDataPoint[]>([]);
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentCognitiveLoad, setCurrentCognitiveLoad] = useState<number>(0);
  const { session } = useAuth();

  // Cognitive load thresholds
  const thresholds = {
    low: 40,
    medium: 80,
    high: 100,
  };

  // Calculate derived values
  const maxLoad =
    cognitiveLoadData.length > 0
      ? Math.max(...cognitiveLoadData.map((d) => d.load))
      : 0;

  const avgLoad =
    cognitiveLoadData.length > 0
      ? cognitiveLoadData.reduce((sum, d) => sum + d.load, 0) /
        cognitiveLoadData.length
      : 0;

  const fetchDashboardData = async () => {
    console.log("[USE_DASHBOARD_DATA] Fetching dashboard data...", {
      selectedDate: `${selectedDate.year}-${selectedDate.month}-${selectedDate.day}`,
      hasSession: !!session,
      userId: session?.user?.id,
    });
    try {
      setLoading(true);
      setError(null);

      // Convert CalendarDate to YYYY-MM-DD format
      const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;

      console.log("[USE_DASHBOARD_DATA] Formatted date:", formattedDate);

      // Fetch batch scores and sessions for this date; await both so we never show
      // the chart with wrong or stale session data when switching dates
      const [result, sessionsResult] = await Promise.all([
        fetchBatchScores(formattedDate, formattedDate),
        fetchSessions(formattedDate, formattedDate),
      ]);

      console.log("[USE_DASHBOARD_DATA] Batch scores result:", {
        success: result.success,
        dataCount: result.data?.length || 0,
        hasMissingData: !!result.missing_data,
      });
      console.log("[USE_DASHBOARD_DATA] Sessions result:", {
        success: sessionsResult.success,
        sessionCount: sessionsResult.data?.length || 0,
      });

      if (sessionsResult.success && Array.isArray(sessionsResult.data)) {
        setSessions(sessionsResult.data);
      } else {
        setSessions([]);
      }

      // Transform the API response data into CognitiveLoadDataPoint format
      if (result.success && Array.isArray(result.data)) {
        const transformedData: CognitiveLoadDataPoint[] = result.data.map(
          (item: any) => {
            return {
              timestamp: item.timestamp_iso ?? item.timestamp,
              load: Number(item.score_total),
              focus: item.score_concentration,
              strain: item.score_frustration,
              energy: item.score_pressure,
            };
          }
        );

        setCognitiveLoadData(transformedData);

        // Set missing data if available
        if (result.missing_data && Array.isArray(result.missing_data)) {
          setMissingData(result.missing_data);
        } else {
          setMissingData([]);
        }

        // Use the latest data point for metrics
        if (result.data.length > 0) {
          const latestData = result.data[result.data.length - 1];

          // Set current cognitive load from latest score_total
          setCurrentCognitiveLoad(Math.round(latestData.score_total));

          const metrics: MetricData[] = [
            {
              title: "Frustration",
              value: Math.round(latestData.score_frustration) || 0,
              color: "primary",
              description:
                "Measures emotional stress and irritation levels during cognitive tasks",
            },
            {
              title: "Workload",
              value: Math.round(latestData.score_pressure) || 0,
              color: "danger",
              description:
                "Indicates time constraints and external demands affecting performance",
            },
            {
              title: "Focus",
              value: Math.round(latestData.score_concentration) || 0,
              color: "secondary",
              description:
                "Reflects ability to maintain focused attention on current tasks",
            },
          ];
          setMetricsData(metrics);
        } else {
          setMetricsData([]);
          setCurrentCognitiveLoad(0);
        }
      } else {
        setCognitiveLoadData([]);
        setMissingData([]);
        setMetricsData([]);
        setCurrentCognitiveLoad(0);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboard data";
      setError(errorMessage);
      console.error("[USE_DASHBOARD_DATA] ❌ Failed to fetch dashboard data:", err);
      if (err instanceof Error) {
        console.error("[USE_DASHBOARD_DATA] Error details:", {
          message: err.message,
          stack: err.stack,
        });
      }
      setCognitiveLoadData([]);
      setMissingData([]);
      setMetricsData([]);
      setCurrentCognitiveLoad(0);
      setSessions([]);
    } finally {
      setLoading(false);
      console.log("[USE_DASHBOARD_DATA] Fetch completed");
    }
  }; // Load data on mount and when session or selectedDate changes
  useEffect(() => {
    fetchDashboardData();
  }, [session, selectedDate]);

  return {
    cognitiveLoadData,
    missingData,
    metricsData,
    sessions,
    currentCognitiveLoad,
    maxLoad,
    avgLoad,
    thresholds,
    loading,
    error,
    session,
  };
};

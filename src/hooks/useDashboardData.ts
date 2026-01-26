import { useState, useEffect } from "react";
import { fetchBatchScores } from "../utils/batchScoresApi";
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
    try {
      setLoading(true);
      setError(null);

      // Convert CalendarDate to YYYY-MM-DD format
      const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;

      // Fetch batch scores from the server for the selected date
      // user_id and jwt_token will be retrieved from app state in Rust
      const result = await fetchBatchScores(formattedDate, formattedDate);

      console.log("Batch scores result:", result);

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
      console.error("Failed to fetch dashboard data:", err);
      setCognitiveLoadData([]);
      setMissingData([]);
      setMetricsData([]);
      setCurrentCognitiveLoad(0);
    } finally {
      setLoading(false);
    }
  }; // Load data on mount and when session or selectedDate changes
  useEffect(() => {
    fetchDashboardData();
  }, [session, selectedDate]);

  return {
    cognitiveLoadData,
    missingData,
    metricsData,
    currentCognitiveLoad,
    maxLoad,
    avgLoad,
    thresholds,
    loading,
    error,
    session,
  };
};

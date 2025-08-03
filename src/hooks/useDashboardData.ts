import { useState, useEffect } from "react";

export interface CognitiveLoadDataPoint {
  time: string;
  focus: number;
  strain: number;
  energy: number;
}

export interface SessionData {
  start: string;
  end: string;
  name: string;
}

interface UseDashboardDataReturn {
  cognitiveLoadData: CognitiveLoadDataPoint[];
  sessionData: SessionData[];
  currentCognitiveLoad: number;
  maxLoad: number;
  avgLoad: number;
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in the future this will be fetched from API
  const cognitiveLoadData: CognitiveLoadDataPoint[] = [
    { time: "6:00", focus: 3.1, strain: 1.8, energy: 2.5 },
    { time: "7:00", focus: 4.2, strain: 2.1, energy: 3.8 },
    { time: "8:00", focus: 5.5, strain: 2.8, energy: 4.5 },
    { time: "9:00", focus: 6.8, strain: 3.5, energy: 5.2 },
    { time: "10:00", focus: 7.2, strain: 4.8, energy: 6.1 },
    { time: "11:00", focus: 8.1, strain: 5.5, energy: 6.8 },
    { time: "12:00", focus: 6.5, strain: 4.2, energy: 5.8 },
    { time: "13:00", focus: 5.8, strain: 3.8, energy: 5.2 },
    { time: "14:00", focus: 7.5, strain: 5.8, energy: 6.5 },
    { time: "15:00", focus: 8.2, strain: 6.2, energy: 7.1 },
    { time: "16:00", focus: 7.8, strain: 5.9, energy: 6.8 },
    { time: "17:00", focus: 6.2, strain: 4.5, energy: 5.5 },
    { time: "18:00", focus: 4.8, strain: 3.2, energy: 4.2 },
    { time: "19:00", focus: 3.5, strain: 2.5, energy: 3.1 },
    { time: "20:00", focus: 2.8, strain: 1.8, energy: 2.5 },
    { time: "21:00", focus: 2.1, strain: 1.2, energy: 1.8 },
  ];

  const sessionData: SessionData[] = [
    { start: "9:00", end: "11:00", name: "Deep Work Session" },
    { start: "14:00", end: "16:00", name: "Focus Block" },
  ];

  const currentCognitiveLoad = 6.8;

  // Calculate derived values
  const maxLoad = Math.max(
    ...cognitiveLoadData.flatMap((d) => [d.focus, d.strain, d.energy])
  );

  const avgLoad =
    cognitiveLoadData.reduce(
      (sum, d) => sum + d.focus + d.strain + d.energy,
      0
    ) /
    (cognitiveLoadData.length * 3);

  // TODO: Replace with actual data fetching
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // In the future, this will make actual API calls:
      // const cognitiveData = await invoke("get_cognitive_load_data");
      // const sessions = await invoke("get_session_data");
      // const currentLoad = await invoke("get_current_cognitive_load");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboard data";
      setError(errorMessage);
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    cognitiveLoadData,
    sessionData,
    currentCognitiveLoad,
    maxLoad,
    avgLoad,
    loading,
    error,
  };
};

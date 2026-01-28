import { useState, useEffect } from "react";
import { fetchProductivityTime } from "../utils/productivityTimeApi";
import { useAuth } from "./useAuth";
import type { CalendarDate } from "@internationalized/date";
import { Session } from "@supabase/supabase-js";

export interface UseProductivityTimeReturn {
  categoryCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
  session: Session | null;
}

export const useProductivityTime = (
  selectedDate: CalendarDate
): UseProductivityTimeReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const { session } = useAuth();

  const fetchProductivityTimeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert CalendarDate to YYYY-MM-DD format
      const formattedDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;

      // Fetch productivity time from the server for the selected date
      const result = await fetchProductivityTime(formattedDate);

      console.log("Productivity time result:", result);

      // Set category counts from the response
      if (result.success && result.data) {
        setCategoryCounts(result.data);
      } else {
        setCategoryCounts({});
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch productivity time";
      setError(errorMessage);
      console.error("Failed to fetch productivity time:", err);
      setCategoryCounts({});
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when session or selectedDate changes
  useEffect(() => {
    fetchProductivityTimeData();
  }, [session, selectedDate]);

  return {
    categoryCounts,
    loading,
    error,
    session,
  };
};

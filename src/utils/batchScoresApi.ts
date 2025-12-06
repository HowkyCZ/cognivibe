import { invoke } from "@tauri-apps/api/core";

export interface DateRange {
  start: string;
  end: string;
}

export interface MissingDataPoint {
  timestamp: string;
  score_total: number | null;
  score_focus: number | null;
  score_strain: number | null;
  score_energy: number | null;
}

export interface BatchScoresResponse {
  success: boolean;
  message: string;
  user_id: string;
  date_range: DateRange;
  data: any; // Replace with actual data structure when known
  missing_data: MissingDataPoint[];
}

/**
 * Fetches batch scores from the server API
 * Note: API base URL is read from VITE_SERVER_URL environment variable in Rust
 * Note: userId and jwtToken will be retrieved from app state in Rust
 * @param startDate - Start date in ISO format (e.g., "2024-01-01")
 * @param endDate - End date in ISO format (e.g., "2024-01-31")
 * @returns Promise with the batch scores response
 */
export async function fetchBatchScores(
  startDate: string,
  endDate: string
): Promise<BatchScoresResponse> {
  try {
    const response = await invoke<BatchScoresResponse>(
      "fetch_batch_scores_cmd",
      {
        startDate,
        endDate,
      }
    );

    console.log("Batch scores fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to fetch batch scores:", error);
    throw error;
  }
}

// Example usage:
// const scores = await fetchBatchScores(
//   '2024-01-01',
//   '2024-01-31'
// );

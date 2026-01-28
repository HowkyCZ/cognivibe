import { fetch } from "@tauri-apps/plugin-http";
import { getApiBaseUrl } from "./apiConfig";
import { createSupabaseClient } from "./createSupabaseClient";

export interface QuestionnaireScores {
  oa?: number;
  ft1?: number;
  ft2?: number;
  wom?: number;
  wot?: number;
  fo1?: number;
  fo2?: number;
}

export interface EndSessionResponse {
  success: boolean;
  message: string;
  data?: {
    session_id: string;
    timestamp_start: string;
    timestamp_end: string;
    length: number;
    category_share: Record<string, number>;
    score_total: number | null;
    score_frustration: number | null;
    score_pressure: number | null;
    score_concentration: number | null;
  };
  error?: string;
}

/**
 * Ends a session with optional questionnaire scores.
 * This function calls the session end API endpoint and includes survey responses.
 *
 * @param sessionId - The UUID of the session to end
 * @param scores - Optional questionnaire scores to include with the session
 * @returns Promise with the end session response
 */
export async function endSessionWithSurvey(
  sessionId: string,
  scores?: QuestionnaireScores
): Promise<EndSessionResponse> {
  console.log("[SESSION] Starting endSessionWithSurvey", {
    sessionId,
    hasScores: !!scores,
    scoreKeys: scores ? Object.keys(scores) : [],
  });

  try {
    const supabase = createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("[SESSION] ❌ No session found - authentication required");
      throw new Error("Authentication required. Please log in again.");
    }

    console.log("[SESSION] ✅ Session found, proceeding with end request");

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/sessions/${sessionId}/end`;

    console.log("[SESSION] Sending POST request to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        survey_scores: scores,
      }),
    });

    console.log("[SESSION] Response status:", response.status, response.statusText);

    const result = await response.json();
    console.log("[SESSION] Response data:", result);

    if (!response.ok) {
      console.error("[SESSION] ❌ HTTP error response:", {
        status: response.status,
        error: result.error,
        message: result.message,
      });
      throw new Error(
        result.error || result.message || `HTTP error! status: ${response.status}`
      );
    }

    if (!result.success) {
      console.error("[SESSION] ❌ API returned success=false:", {
        error: result.error,
        message: result.message,
      });
      throw new Error(result.error || result.message || "Failed to end session");
    }

    console.log("[SESSION] ✅ Session ended successfully:", {
      session_id: result.data?.session_id,
      length: result.data?.length,
    });

    return result;
  } catch (error) {
    console.error("[SESSION] ❌ Exception in endSessionWithSurvey:", error);
    if (error instanceof Error) {
      console.error("[SESSION] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

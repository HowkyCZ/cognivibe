import { fetch } from "@tauri-apps/plugin-http";
import { API_CONFIG } from "./apiConfig";

interface ZScoreSurveyResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id: number;
    focused: number;
    stressed: number;
    productive: number;
  };
}

export interface ZScoreSurveyData {
  focused: number;
  stressed: number;
  productive: number;
}

/**
 * Submit Z-score survey responses to the cognitive_scores table
 * @param cognitiveScoreId - The ID of the cognitive_scores row to update
 * @param responses - The survey responses (focused, stressed, productive)
 * @param accessToken - The user's access token for authentication
 */
export const submitZScoreSurvey = async (
  cognitiveScoreId: number,
  responses: ZScoreSurveyData,
  accessToken: string
): Promise<ZScoreSurveyResponse> => {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ZSCORE_SURVEY}/${cognitiveScoreId}/survey`;
    
    console.log("[ZSCORE_SURVEY_API] Submitting survey to:", url);
    
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        focused: responses.focused,
        stressed: responses.stressed,
        productive: responses.productive,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    console.log("[ZSCORE_SURVEY_API] Survey submitted successfully:", result);
    return result as ZScoreSurveyResponse;
  } catch (error) {
    console.error("[ZSCORE_SURVEY_API] Error submitting survey:", error);
    throw error;
  }
};

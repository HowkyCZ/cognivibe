import { fetch } from "@tauri-apps/plugin-http";
import { API_CONFIG } from "./apiConfig";

interface UpdateUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Mark the tutorial as opened for the current user
 */
export const markTutorialOpened = async (
  accessToken: string
): Promise<UpdateUserResponse> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_USER}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opened_tutorial: true,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result as UpdateUserResponse;
  } catch (error) {
    console.error("[USER_API] Error marking tutorial as opened:", error);
    throw error;
  }
};

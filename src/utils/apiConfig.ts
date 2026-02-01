import { isDevMode } from "./constants";

/**
 * Get the API base URL based on the current environment
 * @returns The appropriate API base URL for production or development
 */
export const getApiBaseUrl = (): string => {
  return isDevMode
    ? import.meta.env.VITE_DEVELOPMENT_SERVER_URL
    : import.meta.env.VITE_SERVER_URL;
};

/**
 * API configuration constants
 */
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    SEND_FEEDBACK: "/api/sendFeedback",
    DELETE_USER: "/api/user",
    UPDATE_USER: "/api/user",
    ZSCORE_SURVEY: "/api/scores", // Will be appended with /{id}/survey
  },
} as const;

import { isInDevelopment } from "./constants";

/**
 * Get the API base URL based on the current environment
 * @returns The appropriate API base URL for production or development
 */
export const getApiBaseUrl = (): string => {
  return isInDevelopment
    ? "https://cognivibe-server.vercel.app"
    : "https://server.cognivibe.tech";
};

/**
 * API configuration constants
 */
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    SEND_FEEDBACK: "/api/sendFeedback",
  },
} as const;

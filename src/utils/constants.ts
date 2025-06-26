export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LOGIN: "/auth/login",
  ERROR: "/auth/error",
  CALLBACK: "/auth/callback",
  NOT_FOUND: "/404",
} as const;

export const isInDevelopment = import.meta.env.DEV;

/**
 * Navigation utilities for the CogniVibe app
 */

export const navigateTo = (path: string) => {
  window.location.href = path;
};

export const navigateToHome = () => {
  navigateTo("/");
};

export const isValidRoute = (path: string): boolean => {
  const validRoutes = ["/", "/index.html", "/auth/login"];

  // Remove query parameters and fragments for checking
  const cleanPath = path.split("?")[0].split("#")[0];

  return validRoutes.includes(cleanPath);
};

export const getCurrentPath = (): string => {
  return window.location.pathname;
};

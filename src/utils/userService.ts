import { redirect } from "@tanstack/react-router";
import { createSupabaseClient } from "./createSupabaseClient";
import { ROUTES } from "./constants";

/**
 * Utility function to check if user is already authenticated
 * and redirect to dashboard if they are. Use this in beforeLoad
 * for routes that should not be accessible when logged in.
 */
export const redirectIfAuthenticated = async (
  redirectTo: string = ROUTES.HOME
) => {
  const supabase = createSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (session && !error) {
    throw redirect({
      to: redirectTo,
    });
  }
};
/**
 * Utility function to check if user is authenticated
 * and redirect to login if they are not. Use this in beforeLoad
 * for protected routes that require authentication.
 */
export const requireAuthentication = async (
  loginRedirectTo: string = ROUTES.LOGIN
) => {
  const supabase = createSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log(session);

  if (!session || error) {
    throw redirect({
      to: loginRedirectTo,
    });
  }
};
/**
 * Utility function that redirects users based on authentication status.
 * Authenticated users go to dashboard, unauthenticated users go to login.
 * Use this for root/landing routes that act as authentication-based redirects.
 */
export const redirectByAuthStatus = async (
  authenticatedRedirectTo: string = ROUTES.DASHBOARD,
  unauthenticatedRedirectTo: string = ROUTES.LOGIN
) => {
  const supabase = createSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!session || error) {
    throw redirect({
      to: unauthenticatedRedirectTo,
    });
  } else {
    throw redirect({
      to: authenticatedRedirectTo,
    });
  }
};

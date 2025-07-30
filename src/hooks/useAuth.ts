import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { createSupabaseClient } from "../utils/createSupabaseClient";
import { useRouter } from "@tanstack/react-router";
import { ROUTES } from "../utils/constants";
import { API_CONFIG } from "../utils/apiConfig";

interface UseAuthReturn {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  deleteUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }); // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); // If session becomes null (user signed out), invalidate router and navigate to login
      if (!session) {
        router.invalidate();
        router.navigate({
          to: ROUTES.LOGIN,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const deleteUser = async () => {
    try {
      // Check if user is authenticated
      if (!session) {
        throw new Error("Authentication required. Please log in again.");
      }

      if (!session.user?.id) {
        throw new Error("User ID not found in session.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELETE_USER}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.user.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      if (!result.success) {
        throw new Error(
          result.error || result.message || "Failed to delete account"
        );
      }

      return result;
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      router.invalidate();
      router.navigate({
        to: ROUTES.LOGIN,
      });
    }
  };

  return {
    session,
    loading,
    signOut,
    deleteUser,
  };
};

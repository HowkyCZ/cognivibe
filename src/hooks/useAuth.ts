import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { createSupabaseClient } from "../utils/createSupabaseClient";
import { useRouter } from "@tanstack/react-router";

interface UseAuthReturn {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
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
      setLoading(false);

      // If session becomes null (user signed out), invalidate router and navigate to login
      if (!session) {
        router.invalidate();
        router.navigate({
          to: "/auth/login",
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      // Invalidate all router cache and reload tabs
      router.invalidate();
      router.navigate({
        to: "/auth/login",
      });
    }
  };

  return {
    session,
    loading,
    signOut,
  };
};

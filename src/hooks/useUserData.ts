import { useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "../utils/createSupabaseClient";

interface User {
  user_id: string;
  avatar_url: string | undefined;
  organization: Organization | null;
  opened_tutorial: boolean;
}

interface Organization {
  organization_id: number;
  brand_name: string;
}

interface UseUserDataReturn {
  userData: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserData = (userId?: string): UseUserDataReturn => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseClient();

  const fetchUserData = useCallback(async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from("users")
          .select(
            `
            user_id, 
            avatar_url,
            opened_tutorial,
            organization_id (organization_id, brand_name)
          `
          )
          .eq("user_id", userId)
          .single();

        if (fetchError) {
          console.error("Error fetching user data:", fetchError);
          setError(fetchError.message);
          setUserData(null);
        } else if (data) {
          const transformedData: User = {
            user_id: data.user_id,
            avatar_url: data.avatar_url,
            opened_tutorial: data.opened_tutorial ?? false,
            organization: data.organization_id
              ? {
                  // @ts-ignore
                  organization_id: data.organization_id.organization_id!,
                  // @ts-ignore
                  brand_name: data.organization_id.brand_name!,
                }
              : null,
          };
          setUserData(transformedData);
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error("Unexpected error fetching user data:", err);
        setError("An unexpected error occurred");
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }, [userId, supabase]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    userData,
    loading,
    error,
    refetch: fetchUserData,
  };
};

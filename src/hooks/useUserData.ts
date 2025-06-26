import { useEffect, useState } from "react";
import { createSupabaseClient } from "../utils/createSupabaseClient";

interface User {
  user_id: string;
  created_at: string;
  nickname: string;
  avatar_url: string | undefined;
  organization: Organization | null;
}

interface Organization {
  organization_id: number;
  brand_name: string;
}

interface UseUserDataReturn {
  userData: User | null;
  loading: boolean;
  error: string | null;
}

export const useUserData = (userId?: string): UseUserDataReturn => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const fetchUserData = async () => {
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
            created_at, 
            nickname, 
            avatar_url,
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
            created_at: data.created_at,
            nickname: data.nickname,
            avatar_url: data.avatar_url,
            organization: data.organization_id
              ? {
                  // @ts-ignore
                  organization_id: data.organization_id.organization_id!,
                  // @ts-ignore
                  brand_name: data.organization_id.brand_name!,
                }
              : null,
          };
          console.log(transformedData);
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
    };
    fetchUserData();
  }, [userId, supabase]);

  return {
    userData,
    loading,
    error,
  };
};

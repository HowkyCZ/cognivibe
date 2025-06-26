import { createClient } from "@supabase/supabase-js";

interface SupabaseClientConfig {
  url: string;
  anonKey: string;
}

const supabaseConfig: SupabaseClientConfig = {
  url: import.meta.env.VITE_SUPABASE_URL!,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
};

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error(
    "Supabase URL and anon key must be defined in environment variables."
  );
}

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

export const createSupabaseClient = () => {
  return supabase;
};

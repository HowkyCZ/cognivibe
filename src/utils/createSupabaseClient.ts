import { createClient } from "@supabase/supabase-js";

interface SupabaseClientConfig {
  url: string;
  apiKey: string;
}

const supabaseConfig: SupabaseClientConfig = {
  url: import.meta.env.VITE_SUPABASE_URL!,
  apiKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
};

if (!supabaseConfig.url || !supabaseConfig.apiKey) {
  throw new Error(
    "Supabase URL and anon key must be defined in environment variables."
  );
}

const supabase = createClient(supabaseConfig.url, supabaseConfig.apiKey);

export const createSupabaseClient = () => {
  return supabase;
};

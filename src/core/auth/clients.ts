import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

export const supabaseBrowserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export const supabaseServerClient =
  supabaseServiceKey &&
  createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export function getSupabaseClient(type: "browser" | "server" = "browser") {
  if (type === "server") {
    if (!supabaseServerClient) {
      throw new Error("Server client not available. Missing SUPABASE_SERVICE_ROLE_KEY");
    }
    return supabaseServerClient;
  }
  return supabaseBrowserClient;
}

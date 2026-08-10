import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "./cookie-options";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: getSupabaseCookieOptions(),
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

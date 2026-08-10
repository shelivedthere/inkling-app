import type { CookieOptionsWithName } from "@supabase/ssr";

/** Shared cookie defaults for SSR + browser clients. */
export function getSupabaseCookieOptions(): CookieOptionsWithName {
  return {
    path: "/",
    sameSite: "lax",
    // Required on real HTTPS deploys; must stay false on http://localhost.
    secure: process.env.NODE_ENV === "production",
    // Persist across iOS PWA process kills (session cookies are wiped when
    // the standalone WebKit process is terminated).
    maxAge: 400 * 24 * 60 * 60,
  };
}

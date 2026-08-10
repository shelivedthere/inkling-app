"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * When an iOS home-screen PWA returns to the foreground, nudge the Supabase
 * client to read/refresh the session so expired access tokens recover from
 * the refresh token cookie instead of looking "signed out".
 */
export function AuthSessionKeepalive() {
  useEffect(() => {
    const supabase = createClient();

    async function syncSession() {
      try {
        await supabase.auth.getSession();
      } catch {
        // Ignore — proxy/login flow will handle hard failures.
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void syncSession();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, []);

  return null;
}

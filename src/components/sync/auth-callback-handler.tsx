"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/sync/supabase-client";
import { logger } from "@/lib/logger";

/**
 * Detects Supabase magic-link / OAuth callback tokens in the URL hash
 * and initialises the Supabase client so `detectSessionInUrl` can
 * exchange them for a session.  Redirects to /settings on success.
 *
 * Mount once in AppShell — renders nothing.
 */
export function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;

    async function handleCallback() {
      try {
        // Initialising the client triggers `detectSessionInUrl`,
        // which reads the hash and exchanges the token for a session.
        const client = getSupabaseClient();
        const { data, error } = await client.auth.getSession();

        if (error) {
          logger.error("[AuthCallbackHandler] Session error:", error);
          return;
        }

        if (data.session) {
          // Clean the hash so the token doesn't linger in the URL.
          window.history.replaceState(null, "", window.location.pathname);
          router.push("/settings");
        }
      } catch (err) {
        logger.error("[AuthCallbackHandler] Callback error:", err);
      }
    }

    handleCallback();
  }, [router]);

  return null;
}

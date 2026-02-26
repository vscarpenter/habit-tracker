/**
 * Supabase client singleton.
 *
 * Import `supabase` from this module everywhere in the sync layer.
 * The client is lazily created so that the Supabase SDK is only initialised
 * when the user opts into sync.
 *
 * Required environment variables (add to .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
 *
 * Both variables are NEXT_PUBLIC_ — they are safe to expose in the browser
 * because they are scoped by Row Level Security policies in Supabase.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These will throw at initialisation time (not at module-load time) so that
// the rest of the app can boot without sync configured.
function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  return createClient(url, key, {
    auth: {
      // Persist session in localStorage so users stay signed in across page reloads.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // Required for magic-link redirects.
    },
  });
}

let _client: SupabaseClient | null = null;

/** Returns the shared Supabase client, creating it on the first call. */
export function getSupabaseClient(): SupabaseClient {
  if (!_client) _client = createSupabaseClient();
  return _client;
}

/** Convenience re-export for callers that prefer the named import style. */
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};

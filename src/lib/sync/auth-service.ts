/**
 * Auth service — wraps Supabase Auth with HabitFlow-specific helpers.
 *
 * Supported sign-in methods:
 *   1. Magic link (email, no password) — recommended for privacy-first UX
 *   2. Google OAuth (optional, configured in Supabase dashboard)
 *
 * Usage:
 *   const user = await authService.getUser();
 *   await authService.signInWithMagicLink("user@example.com");
 *   await authService.signOut();
 *   authService.onAuthChange((user) => { ... });
 */

import type { AuthChangeEvent, Session, Subscription } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase-client";
import type { SyncUser } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function sessionToSyncUser(session: Session): SyncUser {
  const { user } = session;
  return {
    id: user.id,
    email: user.email ?? "",
    createdAt: user.created_at,
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Returns the currently authenticated user, or null if not signed in.
   */
  async getUser(): Promise<SyncUser | null> {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    if (!data.session) return null;
    return sessionToSyncUser(data.session);
  },

  /**
   * Sends a magic link to the provided email address.
   * The user clicks the link and is redirected back to the app,
   * where Supabase automatically exchanges the token for a session.
   *
   * @param email    - The user's email address.
   * @param redirectTo - The URL to redirect to after sign-in.
   *                   Defaults to the current page.
   */
  async signInWithMagicLink(
    email: string,
    redirectTo: string = typeof window !== "undefined" ? window.location.origin : ""
  ): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  },

  /**
   * Signs in with Google OAuth.
   * Redirects the browser — no return value.
   */
  async signInWithGoogle(): Promise<void> {
    const client = getSupabaseClient();
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/settings` : "";
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  },

  /**
   * Signs the current user out and clears the local session.
   */
  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  /**
   * Subscribes to auth state changes.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   *
   * @param callback - Called with the new user (or null on sign-out).
   */
  onAuthChange(callback: (user: SyncUser | null) => void): () => void {
    const client = getSupabaseClient();
    const handler = (_event: AuthChangeEvent, session: Session | null) => {
      callback(session ? sessionToSyncUser(session) : null);
    };
    const { data } = client.auth.onAuthStateChange(handler);
    const sub = data.subscription as Subscription;
    return () => sub.unsubscribe();
  },
};

/**
 * useSyncService — React hook that manages sync state and auth.
 *
 * Provides:
 *   - syncState: current SyncState (status, user, lastSyncedAt, ...)
 *   - signInWithMagicLink(email): sends magic link, returns after email is sent
 *   - signInWithGoogle(): redirects to Google OAuth
 *   - signOut(): signs out and clears sync state
 *   - syncNow(): manual "Sync now" trigger
 *   - isSyncConfigured: true when env vars are present
 *
 * Auto-sync behaviour:
 *   - On mount: pulls from remote if the user is signed in
 *   - Debounced push is NOT handled here — wire it up in the service layer
 *     by calling syncService.push() after any DB write (see sync-design.md).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authService } from "@/lib/sync/auth-service";
import { syncService } from "@/lib/sync/sync-service";
import { logger } from "@/lib/logger";
import type { SyncState, SyncUser } from "@/lib/sync/types";

const INITIAL_STATE: SyncState = {
  status: "idle",
  lastSyncedAt: null,
  errorMessage: null,
  isAuthenticated: false,
  user: null,
};

function isSyncConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function useSyncService() {
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_STATE);
  const configured = isSyncConfigured();

  // Avoid overlapping sync operations
  const syncingRef = useRef(false);

  const setUser = useCallback((user: SyncUser | null) => {
    setSyncState((prev) => ({
      ...prev,
      isAuthenticated: Boolean(user),
      user,
    }));
  }, []);

  // ── Auth change listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!configured) return;
    return authService.onAuthChange(setUser);
  }, [configured, setUser]);

  // ── Initial auth check + pull on mount ─────────────────────────────────
  useEffect(() => {
    if (!configured) return;

    async function init() {
      try {
        const user = await authService.getUser();
        setUser(user);
        if (user) await performSync();
      } catch (err) {
        logger.error("[useSyncService] Init error:", err);
      }
    }

    init();
    // performSync intentionally excluded — only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  // ── Core sync operation ─────────────────────────────────────────────────
  const performSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    setSyncState((prev) => ({ ...prev, status: "syncing", errorMessage: null }));

    try {
      await syncService.sync();
      const now = new Date().toISOString();
      setSyncState((prev) => ({
        ...prev,
        status: "success",
        lastSyncedAt: now,
        errorMessage: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown sync error";
      logger.error("[useSyncService] Sync failed:", err);
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: message,
      }));
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────
  const signInWithMagicLink = useCallback(async (email: string) => {
    await authService.signInWithMagicLink(email);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSyncState(INITIAL_STATE);
  }, []);

  return {
    syncState,
    syncNow: performSync,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    isSyncConfigured: configured,
  };
}

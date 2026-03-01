"use client";

/**
 * useRealtimeSync — manages PocketBase SSE subscription for live completion sync.
 *
 * Lifecycle:
 *   - On mount: if authenticated, subscribe to completion changes
 *   - On auth change: subscribe on sign-in, unsubscribe on sign-out
 *   - On PocketBase reconnect: catch-up pull of all remote completions
 *   - On window.online: trigger full snapshot sync to reconcile offline writes
 *   - On unmount: unsubscribe
 *
 * When a remote change arrives, it's written to IndexedDB and `onRemoteChange`
 * is called so the UI can re-render.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { authService } from "@/lib/sync/auth-service";
import {
  completionSyncService,
  type CompletionChangeEvent,
} from "@/lib/sync/completion-sync-service";
import { syncService } from "@/lib/sync/sync-service";
import { db } from "@/db/database";
import { logger } from "@/lib/logger";
import type { SyncUser } from "@/lib/sync/types";
import type { HabitCompletion } from "@/types";

interface UseRealtimeSyncOptions {
  onRemoteChange: () => void;
}

function isSyncConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POCKETBASE_URL);
}

export function useRealtimeSync({ onRemoteChange }: UseRealtimeSyncOptions): void {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onRemoteChangeRef = useRef(onRemoteChange);
  useLayoutEffect(() => {
    onRemoteChangeRef.current = onRemoteChange;
  });

  const handleEvent = useCallback(async (event: CompletionChangeEvent) => {
    try {
      if (event.action === "delete") {
        // Find and delete the local completion matching (habitId, date)
        const local = await db.completions
          .where("[habitId+date]")
          .equals([event.completion.habitId, event.completion.date])
          .first();
        if (local) {
          await db.completions.delete(local.id);
        }
      } else {
        // Create or update — upsert into IndexedDB
        const local = await db.completions
          .where("[habitId+date]")
          .equals([event.completion.habitId, event.completion.date])
          .first();

        const completion: HabitCompletion = {
          id: local?.id ?? event.completion.localId,
          habitId: event.completion.habitId,
          date: event.completion.date,
          completedAt: event.completion.completedAt,
          note: event.completion.note,
        };

        await db.completions.put(completion);
      }

      onRemoteChangeRef.current();
    } catch (err) {
      logger.error("[realtime-sync] Failed to apply remote change", err);
    }
  }, []);

  const subscribe = useCallback(
    (userId: string) => {
      // Clean up any existing subscription
      unsubscribeRef.current?.();

      const unsub = completionSyncService.subscribe(userId, handleEvent);
      unsubscribeRef.current = unsub;

      logger.info("[realtime-sync] Subscribed to completion changes");
    },
    [handleEvent]
  );

  const unsubscribe = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    logger.info("[realtime-sync] Unsubscribed from completion changes");
  }, []);

  // Handle catch-up after going online
  const handleOnline = useCallback(async () => {
    logger.info("[realtime-sync] Back online, triggering catch-up sync");
    try {
      await syncService.sync();
      onRemoteChangeRef.current();
    } catch (err) {
      logger.warn("[realtime-sync] Online catch-up sync failed", err);
    }
  }, []);

  // Main effect: subscribe/unsubscribe based on auth state
  useEffect(() => {
    if (!isSyncConfigured()) return;

    let mounted = true;

    async function init() {
      const user = await authService.getUser();
      if (!mounted) return;
      if (user) subscribe(user.id);
    }

    init();

    // Listen for auth changes
    const unsubAuth = authService.onAuthChange((user: SyncUser | null) => {
      if (!mounted) return;
      if (user) {
        subscribe(user.id);
      } else {
        unsubscribe();
      }
    });

    // Listen for network reconnection
    window.addEventListener("online", handleOnline);

    return () => {
      mounted = false;
      unsubAuth();
      unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
  }, [subscribe, unsubscribe, handleOnline]);
}

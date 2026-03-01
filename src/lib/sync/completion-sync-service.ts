/**
 * Completion sync service — individual completion CRUD against PocketBase
 * plus real-time subscription management.
 *
 * Unlike the snapshot approach (which uploads everything), this service
 * pushes/deletes individual completion records for near-instant propagation.
 * PocketBase's built-in SSE subscriptions deliver remote changes to other
 * devices within ~1 second.
 */

import type { RecordSubscription } from "pocketbase";
import { getPocketBaseClient } from "./pocketbase-client";
import { authService } from "./auth-service";
import { logger } from "@/lib/logger";
import type { HabitCompletion } from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

const COLLECTION = "habitflow_completions";
const ECHO_SUPPRESSION_TTL_MS = 5_000;

// ── Self-echo suppression ────────────────────────────────────────────────────

const recentLocalIds = new Set<string>();

function markAsLocal(localId: string): void {
  recentLocalIds.add(localId);
  setTimeout(() => recentLocalIds.delete(localId), ECHO_SUPPRESSION_TTL_MS);
}

function isLocalEcho(localId: string): boolean {
  return recentLocalIds.has(localId);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface RemoteCompletion {
  habitId: string;
  date: string;
  completedAt: string;
  note?: string;
  localId: string;
}

export type CompletionChangeEvent =
  | { action: "create" | "update"; completion: RemoteCompletion }
  | { action: "delete"; completion: RemoteCompletion };

// ── Service ──────────────────────────────────────────────────────────────────

export const completionSyncService = {
  /**
   * Pushes (upserts) a single completion to PocketBase.
   * If a record with the same (ownerId, habitId, date) already exists,
   * it updates it; otherwise creates a new one.
   */
  async pushCompletion(userId: string, completion: HabitCompletion): Promise<void> {
    const client = getPocketBaseClient();
    const data = {
      ownerId: userId,
      habitId: completion.habitId,
      date: completion.date,
      completedAt: completion.completedAt,
      note: completion.note ?? "",
      localId: completion.id,
    };

    markAsLocal(completion.id);

    try {
      // Try to find existing record for this (ownerId, habitId, date)
      const existing = await client
        .collection(COLLECTION)
        .getFirstListItem(
          `ownerId="${userId}" && habitId="${completion.habitId}" && date="${completion.date}"`,
          { requestKey: null }
        );

      await client.collection(COLLECTION).update(existing.id, data, {
        requestKey: null,
      });
    } catch (error) {
      if (!isNotFoundError(error)) {
        logger.error("[completion-sync] Push update failed, trying create", error);
      }

      try {
        await client.collection(COLLECTION).create(data, { requestKey: null });
      } catch (createError) {
        // Duplicate key means another device already created it — that's fine
        if (!isUniqueViolation(createError)) {
          logger.error("[completion-sync] Push create failed", createError);
        }
      }
    }
  },

  /**
   * Deletes the completion record for (ownerId, habitId, date) from PocketBase.
   */
  async deleteCompletion(userId: string, habitId: string, date: string, localId: string): Promise<void> {
    const client = getPocketBaseClient();

    markAsLocal(localId);

    try {
      const existing = await client
        .collection(COLLECTION)
        .getFirstListItem(
          `ownerId="${userId}" && habitId="${habitId}" && date="${date}"`,
          { requestKey: null }
        );

      await client.collection(COLLECTION).delete(existing.id, { requestKey: null });
    } catch (error) {
      // Already deleted or never existed — both are fine
      if (!isNotFoundError(error)) {
        logger.error("[completion-sync] Delete failed", error);
      }
    }
  },

  /**
   * Subscribes to real-time changes on the completions collection for a user.
   * Returns an unsubscribe function.
   *
   * Events whose `localId` matches a recently-pushed completion are
   * suppressed to prevent self-echo.
   */
  subscribe(
    userId: string,
    onChange: (event: CompletionChangeEvent) => void
  ): () => void {
    const client = getPocketBaseClient();

    // PocketBase SSE subscription with server-side filter
    const unsubscribePromise = client
      .collection(COLLECTION)
      .subscribe("*", (event: RecordSubscription) => {
        const record = event.record;

        // Only process records belonging to this user
        if (record.ownerId !== userId) return;

        const localId = typeof record.localId === "string" ? record.localId : "";

        // Suppress self-echo
        if (localId && isLocalEcho(localId)) {
          logger.info("[completion-sync] Suppressed self-echo", { localId });
          return;
        }

        const completion: RemoteCompletion = {
          habitId: record.habitId as string,
          date: record.date as string,
          completedAt: record.completedAt as string,
          note: record.note as string | undefined,
          localId,
        };

        onChange({ action: event.action as "create" | "update" | "delete", completion });
      }, {
        filter: `ownerId="${userId}"`,
      });

    // Return a synchronous cleanup function for use in React useEffect
    return () => {
      unsubscribePromise.then((unsub) => unsub());
    };
  },

  /**
   * Pulls all remote completions for catch-up after reconnect.
   * Returns the full list so the caller can reconcile with IndexedDB.
   */
  async pullAllCompletions(userId: string): Promise<RemoteCompletion[]> {
    const client = getPocketBaseClient();

    try {
      const records = await client
        .collection(COLLECTION)
        .getFullList({ filter: `ownerId="${userId}"`, requestKey: null });

      return records.map((r) => ({
        habitId: r.habitId as string,
        date: r.date as string,
        completedAt: r.completedAt as string,
        note: r.note as string | undefined,
        localId: r.localId as string,
      }));
    } catch (error) {
      logger.error("[completion-sync] Pull all failed", error);
      return [];
    }
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as Record<string, unknown>;
  return e.status === 404 || e.statusCode === 404;
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as Record<string, unknown>;
  // PocketBase returns 400 for unique constraint violations
  if (e.status === 400 || e.statusCode === 400) return true;
  return false;
}

/**
 * Fire-and-forget wrapper — call after a local toggle/addNote.
 * Auth check happens at call time so it's safe to call unconditionally.
 */
export async function scheduleCompletionPush(completion: HabitCompletion): Promise<void> {
  try {
    const user = await authService.getUser();
    if (!user) return;
    await completionSyncService.pushCompletion(user.id, completion);
  } catch (err) {
    logger.warn("[completion-sync] Background push failed", err);
  }
}

/**
 * Fire-and-forget wrapper for deleting a completion from remote.
 */
export async function scheduleCompletionDelete(habitId: string, date: string, localId: string): Promise<void> {
  try {
    const user = await authService.getUser();
    if (!user) return;
    await completionSyncService.deleteCompletion(user.id, habitId, date, localId);
  } catch (err) {
    logger.warn("[completion-sync] Background delete failed", err);
  }
}

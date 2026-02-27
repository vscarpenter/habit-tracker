/**
 * Sync service — coordinates pull/push between IndexedDB and Supabase Storage.
 *
 * Storage layout (Supabase Storage bucket: "habit-data"):
 *   {userId}/data.json    ← the user's full snapshot in ExportData format
 *
 * Sync flow:
 *   pull()  — fetch remote snapshot, merge into local IndexedDB, apply
 *   push()  — build local snapshot, upload to Supabase Storage
 *   sync()  — pull then push (the typical "sync now" operation)
 *
 * Conflict resolution (handled by mergeSnapshots in merge.ts):
 *   Habits      → last-write-wins per record (by updatedAt)
 *   Completions → union merge; same (habitId, date) → keep latest completedAt
 *   Settings    → last-write-wins (by updatedAt)
 *   Hard deletes → NOT propagated; use archive instead
 */

import { getSupabaseClient } from "./supabase-client";
import { authService } from "./auth-service";
import { mergeSnapshots } from "./merge";
import {
  buildExportPayload,
  applyImport,
  validateImportData,
} from "@/lib/export-import";
import { logger } from "@/lib/logger";
import type { MergeResult } from "./types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_BUCKET = "habit-data";

function remotePath(userId: string): string {
  return `${userId}/data.json`;
}

// ── Error helpers ─────────────────────────────────────────────────────────────

/** Extract HTTP status from a Supabase StorageApiError (or similar). */
function getErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const e = error as Record<string, unknown>;
  if (typeof e.status === "number") return e.status;
  if (typeof e.statusCode === "number") return e.statusCode;
  if (typeof e.statusCode === "string") return parseInt(e.statusCode, 10) || null;
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  return "Unknown error";
}

/** Build a user-friendly error message with actionable guidance for storage failures. */
function storageErrorWithContext(operation: string, error: unknown): Error {
  const status = getErrorStatus(error);
  const msg = getErrorMessage(error);

  if (msg.toLowerCase().includes("bucket not found")) {
    return new Error(
      'Storage bucket "habit-data" not found. Create it in Supabase Dashboard → Storage → New bucket (private).'
    );
  }
  if (status === 400) {
    return new Error(
      `Storage ${operation} failed (400): ${msg}. ` +
        'Verify the "habit-data" bucket exists in Supabase Storage and RLS policies are applied.'
    );
  }
  if (status === 403) {
    return new Error(
      `Storage ${operation} denied (403): ${msg}. ` +
        "Check that RLS policies allow authenticated users to read/write their own folder."
    );
  }
  return new Error(`Sync ${operation} failed (${status ?? "?"}): ${msg}`);
}

// ── Service ──────────────────────────────────────────────────────────────────

export const syncService = {
  /**
   * Pulls the remote snapshot and merges it into local IndexedDB.
   * No-op (returns null) if the user is not authenticated.
   *
   * @returns MergeResult describing what changed, or null if skipped.
   */
  async pull(): Promise<MergeResult | null> {
    const user = await authService.getUser();
    if (!user) return null;

    const client = getSupabaseClient();
    const storage = client.storage.from(STORAGE_BUCKET);

    // Check if a remote snapshot exists before downloading.
    // list() returns a reliable response; download() on a missing file returns
    // unparseable errors in some Supabase configurations (StorageUnknownError).
    const { data: files, error: listError } = await storage.list(user.id, {
      limit: 1,
      search: "data.json",
    });

    if (listError) {
      logger.error("[sync] List failed:", { message: getErrorMessage(listError) });
      throw storageErrorWithContext("list", listError);
    }

    const hasRemoteSnapshot = files?.some((f) => f.name === "data.json");
    if (!hasRemoteSnapshot) {
      logger.info("[sync] No remote snapshot found — first sync");
      return null;
    }

    // Download the remote snapshot
    const path = remotePath(user.id);
    const { data, error } = await storage.download(path);

    if (error) {
      const status = getErrorStatus(error);
      logger.error("[sync] Pull download failed:", { status, message: getErrorMessage(error) });
      throw storageErrorWithContext("download", error);
    }

    // Parse and validate the remote snapshot
    const raw: unknown = JSON.parse(await data.text());
    const validation = validateImportData(raw);
    if (!validation.valid) {
      throw new Error(
        `Remote snapshot failed validation: ${validation.errors.join(", ")}`
      );
    }

    // Build local snapshot and merge
    const local = await buildExportPayload();
    const { merged, result } = mergeSnapshots(local, validation.data);

    // Apply merged data to IndexedDB only if something changed
    if (result.hasChanges) {
      await applyImport(merged);
      logger.info("[sync] Pull applied changes", result.stats);
    } else {
      logger.info("[sync] Pull: local is already up to date");
    }

    return result;
  },

  /**
   * Pushes the current local IndexedDB snapshot to Supabase Storage.
   * No-op if the user is not authenticated.
   */
  async push(): Promise<void> {
    const user = await authService.getUser();
    if (!user) return;

    const client = getSupabaseClient();
    const snapshot = await buildExportPayload();
    const json = JSON.stringify(snapshot);
    const blob = new Blob([json], { type: "application/json" });
    const path = remotePath(user.id);

    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(path, blob, { upsert: true, contentType: "application/json" });

    if (error) {
      const status = getErrorStatus(error);
      logger.error("[sync] Push failed:", { status, message: getErrorMessage(error) });
      throw storageErrorWithContext("upload", error);
    }

    logger.info("[sync] Push complete", {
      habits: snapshot.data.habits.length,
      completions: snapshot.data.completions.length,
    });
  },

  /**
   * Full bidirectional sync: pull → merge → apply → push merged result.
   *
   * This is the operation triggered by "Sync now" or on app load.
   */
  async sync(): Promise<MergeResult | null> {
    const result = await this.pull();
    await this.push();
    return result;
  },
};

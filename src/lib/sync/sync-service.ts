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
    const path = remotePath(user.id);

    // Download the remote snapshot
    const { data, error } = await client.storage.from(STORAGE_BUCKET).download(path);

    // 404 means the user has never synced — that's fine, just skip the pull.
    if (error) {
      const msg = (error as { message?: string }).message ?? "";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        logger.info("[sync] No remote snapshot found — first sync");
        return null;
      }
      throw error;
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

    if (error) throw error;

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

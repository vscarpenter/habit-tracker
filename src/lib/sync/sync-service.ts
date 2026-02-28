/**
 * Sync service — coordinates pull/push between IndexedDB and PocketBase.
 *
 * Storage layout (PocketBase collection: "habitflow_sync_snapshots"):
 *   ownerId=<userId>, payload=<full ExportData snapshot>
 *
 * Sync flow:
 *   pull()  — fetch remote snapshot, merge into local IndexedDB, apply
 *   push()  — build local snapshot, upsert into PocketBase
 *   sync()  — pull then push (the typical "sync now" operation)
 */

import { ClientResponseError } from "pocketbase";
import { getPocketBaseClient } from "./pocketbase-client";
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

const SYNC_COLLECTION = "habitflow_sync_snapshots";

// ── Error helpers ─────────────────────────────────────────────────────────────

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const e = error as Record<string, unknown>;
  if (typeof e.status === "number") return e.status;
  if (typeof e.statusCode === "number") return e.statusCode;
  if (typeof e.statusCode === "string") return parseInt(e.statusCode, 10) || null;
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    return error.response?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  return "Unknown error";
}

function syncErrorWithContext(operation: string, error: unknown): Error {
  const status = getErrorStatus(error);
  const msg = getErrorMessage(error);

  if (status === 404) {
    return new Error(
      `PocketBase sync ${operation} failed (404): record or collection not found. ` +
        'Verify the "habitflow_sync_snapshots" collection exists.'
    );
  }
  if (status === 400) {
    return new Error(
      `PocketBase sync ${operation} failed (400): ${msg}. ` +
        'Check collection fields and validation rules.'
    );
  }
  if (status === 403) {
    return new Error(
      `PocketBase sync ${operation} denied (403): ${msg}. ` +
        "Check collection API rules for ownerId access."
    );
  }
  return new Error(`PocketBase sync ${operation} failed (${status ?? "?"}): ${msg}`);
}

function isNotFound(error: unknown): boolean {
  return getErrorStatus(error) === 404;
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

    const client = getPocketBaseClient();
    let remotePayload: unknown = null;

    try {
      const record = await client
        .collection(SYNC_COLLECTION)
        .getFirstListItem(`ownerId="${user.id}"`, { requestKey: null });
      remotePayload = record.payload;
    } catch (error) {
      if (isNotFound(error)) {
        logger.info("[sync] No remote snapshot found — first sync");
        return null;
      }
      logger.error("[sync] Pull failed:", { message: getErrorMessage(error) });
      throw syncErrorWithContext("pull", error);
    }

    // Parse and validate the remote snapshot
    const validation = validateImportData(remotePayload);
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
   * Pushes the current local IndexedDB snapshot to PocketBase.
   * No-op if the user is not authenticated.
   */
  async push(): Promise<void> {
    const user = await authService.getUser();
    if (!user) return;

    const client = getPocketBaseClient();
    const snapshot = await buildExportPayload();
    const data = {
      ownerId: user.id,
      payload: snapshot,
      exportedAt: snapshot.exportedAt,
    };

    try {
      const existing = await client
        .collection(SYNC_COLLECTION)
        .getFirstListItem(`ownerId="${user.id}"`, { requestKey: null });

      await client.collection(SYNC_COLLECTION).update(existing.id, data, {
        requestKey: null,
      });
    } catch (error) {
      if (!isNotFound(error)) {
        logger.error("[sync] Push failed:", { message: getErrorMessage(error) });
        throw syncErrorWithContext("push", error);
      }

      try {
        await client.collection(SYNC_COLLECTION).create(data, { requestKey: null });
      } catch (createError) {
        logger.error("[sync] Push create failed:", { message: getErrorMessage(createError) });
        throw syncErrorWithContext("push", createError);
      }
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

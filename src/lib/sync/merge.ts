/**
 * Snapshot merge utility — provider-agnostic.
 *
 * Given a local snapshot and a remote snapshot (both in ExportData shape),
 * produces a merged snapshot and a MergeResult describing what changed.
 *
 * Rules:
 *  - Habits:      last-write-wins per record (keyed on id, compared by updatedAt)
 *  - Completions: union merge; same (habitId, date) pair → keep latest completedAt
 *  - Settings:    last-write-wins (compared by updatedAt)
 *  - Hard deletes are NOT propagated — users should archive instead of delete
 */

import type { ExportData } from "@/lib/export-import";
import type { Habit, HabitCompletion, UserSettings } from "@/types";
import type { MergeResult } from "./types";

// ── Internal helpers ─────────────────────────────────────────────────────────

function newerHabit(a: Habit, b: Habit): Habit {
  return new Date(a.updatedAt) >= new Date(b.updatedAt) ? a : b;
}

function mergeHabits(local: Habit[], remote: Habit[]): { habits: Habit[]; updated: number } {
  const map = new Map<string, Habit>();

  for (const h of local) map.set(h.id, h);

  let updated = 0;
  for (const h of remote) {
    const existing = map.get(h.id);
    if (!existing) {
      map.set(h.id, h);
      updated++;
    } else {
      const winner = newerHabit(existing, h);
      if (winner.updatedAt !== existing.updatedAt) {
        map.set(h.id, winner);
        updated++;
      }
    }
  }

  return { habits: Array.from(map.values()), updated };
}

function completionKey(c: HabitCompletion): string {
  return `${c.habitId}::${c.date}`;
}

function mergeCompletions(
  local: HabitCompletion[],
  remote: HabitCompletion[]
): { completions: HabitCompletion[]; added: number } {
  const map = new Map<string, HabitCompletion>();

  for (const c of local) map.set(completionKey(c), c);

  let added = 0;
  for (const c of remote) {
    const key = completionKey(c);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, c);
      added++;
    } else {
      // Keep the entry with the later completedAt
      if (new Date(c.completedAt) > new Date(existing.completedAt)) {
        map.set(key, c);
        // Not strictly "added" but counts as a change
        added++;
      }
    }
  }

  return { completions: Array.from(map.values()), added };
}

function mergeSettings(local: UserSettings, remote: UserSettings): UserSettings {
  return new Date(local.updatedAt) >= new Date(remote.updatedAt) ? local : remote;
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface MergeOutput {
  merged: ExportData;
  result: MergeResult;
}

/**
 * Merges a remote snapshot into a local snapshot.
 *
 * @param local  - The snapshot built from the local IndexedDB.
 * @param remote - The snapshot fetched from the configured sync provider.
 * @returns      An object containing the merged ExportData and a MergeResult.
 */
export function mergeSnapshots(local: ExportData, remote: ExportData): MergeOutput {
  const { habits, updated: habitsUpdated } = mergeHabits(
    local.data.habits,
    remote.data.habits
  );

  const { completions, added: completionsAdded } = mergeCompletions(
    local.data.completions,
    remote.data.completions
  );

  const settings = mergeSettings(local.data.settings, remote.data.settings);
  const settingsUpdated = settings.updatedAt !== local.data.settings.updatedAt;

  const merged: ExportData = {
    version: local.version,
    exportedAt: new Date().toISOString(),
    app: "HabitFlow",
    data: { habits, completions, settings },
  };

  const hasChanges = habitsUpdated > 0 || completionsAdded > 0 || settingsUpdated;

  return {
    merged,
    result: {
      hasChanges,
      stats: { habitsUpdated, completionsAdded, settingsUpdated },
    },
  };
}

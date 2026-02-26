/**
 * Provider-agnostic snapshot merge logic.
 *
 * Strategy:
 *   - Habits:      last-write-wins per record (by `updatedAt`)
 *   - Completions: union merge; same (habitId, date) → keep latest by `completedAt`
 *   - Settings:    last-write-wins (by `updatedAt`)
 *
 * Hard deletes are NOT propagated. Sync users should prefer archiving habits
 * over deleting them so that the deletion is reflected across devices.
 */

import type { ExportData } from "@/lib/export-import";
import type { Habit, HabitCompletion, UserSettings } from "@/types";

export interface MergeResult {
  merged: ExportData;
  /** True if local and remote differed on at least one record */
  hadConflict: boolean;
}

/**
 * Merge two snapshots into one.
 * Returns the merged payload and a flag indicating whether a conflict was resolved.
 */
export function mergeSnapshots(
  local: ExportData,
  remote: ExportData
): MergeResult {
  const { habits, hadConflict: habitsConflict } = mergeHabits(
    local.data.habits,
    remote.data.habits
  );
  const { completions, hadConflict: completionsConflict } = mergeCompletions(
    local.data.completions,
    remote.data.completions
  );
  const { settings, hadConflict: settingsConflict } = mergeSettings(
    local.data.settings,
    remote.data.settings
  );

  return {
    merged: {
      version: local.version,
      exportedAt: new Date().toISOString(),
      app: "HabitFlow",
      data: { habits, completions, settings },
    },
    hadConflict: habitsConflict || completionsConflict || settingsConflict,
  };
}

// ── Habits ───────────────────────────────────────────────────────────────────

function mergeHabits(
  local: Habit[],
  remote: Habit[]
): { habits: Habit[]; hadConflict: boolean } {
  const map = new Map<string, Habit>();

  for (const habit of local) {
    map.set(habit.id, habit);
  }

  let hadConflict = false;

  for (const remoteHabit of remote) {
    const localHabit = map.get(remoteHabit.id);
    if (!localHabit) {
      // New habit from remote device — add it
      map.set(remoteHabit.id, remoteHabit);
      hadConflict = true;
    } else if (remoteHabit.updatedAt > localHabit.updatedAt) {
      // Remote is newer — take remote version
      map.set(remoteHabit.id, remoteHabit);
      hadConflict = true;
    }
    // else: local is newer or equal — keep local (no-op)
  }

  return { habits: Array.from(map.values()), hadConflict };
}

// ── Completions ───────────────────────────────────────────────────────────────

function mergeCompletions(
  local: HabitCompletion[],
  remote: HabitCompletion[]
): { completions: HabitCompletion[]; hadConflict: boolean } {
  // Primary key for deduplication: exact UUID
  const byId = new Map<string, HabitCompletion>();
  // Secondary dedup key: same habit + same date (two devices created separate IDs)
  const byHabitDate = new Map<string, HabitCompletion>();

  let hadConflict = false;

  function upsert(completion: HabitCompletion): void {
    const dateKey = `${completion.habitId}::${completion.date}`;
    const existing = byHabitDate.get(dateKey);

    if (!existing) {
      byId.set(completion.id, completion);
      byHabitDate.set(dateKey, completion);
    } else if (completion.completedAt > existing.completedAt) {
      // Same day, different records — keep the later one
      byId.delete(existing.id);
      byId.set(completion.id, completion);
      byHabitDate.set(dateKey, completion);
      hadConflict = true;
    }
  }

  for (const c of local) upsert(c);
  for (const c of remote) {
    if (!byId.has(c.id)) {
      hadConflict = true;
    }
    upsert(c);
  }

  return { completions: Array.from(byId.values()), hadConflict };
}

// ── Settings ──────────────────────────────────────────────────────────────────

function mergeSettings(
  local: UserSettings,
  remote: UserSettings
): { settings: UserSettings; hadConflict: boolean } {
  if (remote.updatedAt > local.updatedAt) {
    return { settings: remote, hadConflict: true };
  }
  return { settings: local, hadConflict: false };
}

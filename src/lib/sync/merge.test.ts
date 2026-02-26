import { describe, it, expect } from "vitest";
import { mergeSnapshots } from "./merge";
import type { ExportData } from "@/lib/export-import";
import type { Habit, HabitCompletion, UserSettings } from "@/types";

// ── Factories ────────────────────────────────────────────────────────────────

function makeSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: "user_settings",
    theme: "system",
    weekStartsOn: 0,
    showStreaks: true,
    showCompletionRate: true,
    defaultView: "today",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeHabit(id: string, updatedAt: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: `Habit ${id}`,
    icon: "⭐",
    color: "#3B82F6",
    frequency: "daily",
    sortOrder: 0,
    isArchived: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt,
    ...overrides,
  };
}

function makeCompletion(
  habitId: string,
  date: string,
  completedAt: string,
  overrides: Partial<HabitCompletion> = {}
): HabitCompletion {
  return {
    id: `${habitId}-${date}`,
    habitId,
    date,
    completedAt,
    ...overrides,
  };
}

function makeSnapshot(
  habits: Habit[],
  completions: HabitCompletion[],
  settings: UserSettings
): ExportData {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    app: "HabitFlow",
    data: { habits, completions, settings },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("mergeSnapshots", () => {
  describe("habits", () => {
    it("keeps local habit when local is newer", () => {
      const local = makeHabit("a", "2025-06-02T10:00:00.000Z", { name: "Local Name" });
      const remote = makeHabit("a", "2025-06-01T10:00:00.000Z", { name: "Remote Name" });

      const { merged } = mergeSnapshots(
        makeSnapshot([local], [], makeSettings()),
        makeSnapshot([remote], [], makeSettings())
      );

      expect(merged.data.habits[0].name).toBe("Local Name");
    });

    it("adopts remote habit when remote is newer", () => {
      const local = makeHabit("a", "2025-06-01T10:00:00.000Z", { name: "Local Name" });
      const remote = makeHabit("a", "2025-06-02T10:00:00.000Z", { name: "Remote Name" });

      const { merged } = mergeSnapshots(
        makeSnapshot([local], [], makeSettings()),
        makeSnapshot([remote], [], makeSettings())
      );

      expect(merged.data.habits[0].name).toBe("Remote Name");
    });

    it("adds remote-only habits to the merged result", () => {
      const localHabit = makeHabit("local-only", "2025-06-01T00:00:00.000Z");
      const remoteHabit = makeHabit("remote-only", "2025-06-01T00:00:00.000Z");

      const { merged, result } = mergeSnapshots(
        makeSnapshot([localHabit], [], makeSettings()),
        makeSnapshot([remoteHabit], [], makeSettings())
      );

      expect(merged.data.habits).toHaveLength(2);
      expect(result.stats.habitsUpdated).toBe(1);
    });
  });

  describe("completions", () => {
    it("unions completions from both sides", () => {
      const c1 = makeCompletion("h1", "2025-06-01", "2025-06-01T08:00:00.000Z");
      const c2 = makeCompletion("h1", "2025-06-02", "2025-06-02T08:00:00.000Z");

      const { merged } = mergeSnapshots(
        makeSnapshot([], [c1], makeSettings()),
        makeSnapshot([], [c2], makeSettings())
      );

      expect(merged.data.completions).toHaveLength(2);
    });

    it("keeps the later completedAt when the same (habitId, date) appears on both sides", () => {
      const earlier = makeCompletion("h1", "2025-06-01", "2025-06-01T07:00:00.000Z");
      const later = makeCompletion("h1", "2025-06-01", "2025-06-01T09:00:00.000Z");

      const { merged, result } = mergeSnapshots(
        makeSnapshot([], [earlier], makeSettings()),
        makeSnapshot([], [later], makeSettings())
      );

      expect(merged.data.completions).toHaveLength(1);
      expect(merged.data.completions[0].completedAt).toBe("2025-06-01T09:00:00.000Z");
      expect(result.stats.completionsAdded).toBe(1);
    });

    it("reports no change when both sides have identical completions", () => {
      const c = makeCompletion("h1", "2025-06-01", "2025-06-01T08:00:00.000Z");

      const { result } = mergeSnapshots(
        makeSnapshot([], [c], makeSettings()),
        makeSnapshot([], [c], makeSettings())
      );

      expect(result.stats.completionsAdded).toBe(0);
    });
  });

  describe("settings", () => {
    it("keeps local settings when local is newer", () => {
      const localSettings = makeSettings({ theme: "dark", updatedAt: "2025-06-02T00:00:00.000Z" });
      const remoteSettings = makeSettings({ theme: "light", updatedAt: "2025-06-01T00:00:00.000Z" });

      const { merged } = mergeSnapshots(
        makeSnapshot([], [], localSettings),
        makeSnapshot([], [], remoteSettings)
      );

      expect(merged.data.settings.theme).toBe("dark");
    });

    it("adopts remote settings when remote is newer", () => {
      const localSettings = makeSettings({ theme: "dark", updatedAt: "2025-06-01T00:00:00.000Z" });
      const remoteSettings = makeSettings({ theme: "light", updatedAt: "2025-06-02T00:00:00.000Z" });

      const { merged, result } = mergeSnapshots(
        makeSnapshot([], [], localSettings),
        makeSnapshot([], [], remoteSettings)
      );

      expect(merged.data.settings.theme).toBe("light");
      expect(result.stats.settingsUpdated).toBe(true);
    });
  });

  describe("hasChanges flag", () => {
    it("returns hasChanges=false when local and remote are identical", () => {
      const habit = makeHabit("a", "2025-06-01T00:00:00.000Z");
      const completion = makeCompletion("a", "2025-06-01", "2025-06-01T08:00:00.000Z");
      const settings = makeSettings();

      const snapshot = makeSnapshot([habit], [completion], settings);
      const { result } = mergeSnapshots(snapshot, snapshot);

      expect(result.hasChanges).toBe(false);
    });

    it("returns hasChanges=true when remote has a newer habit", () => {
      const localHabit = makeHabit("a", "2025-06-01T00:00:00.000Z");
      const remoteHabit = makeHabit("a", "2025-06-02T00:00:00.000Z", { name: "Updated" });

      const { result } = mergeSnapshots(
        makeSnapshot([localHabit], [], makeSettings()),
        makeSnapshot([remoteHabit], [], makeSettings())
      );

      expect(result.hasChanges).toBe(true);
    });
  });
});

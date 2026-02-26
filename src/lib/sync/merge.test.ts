import { describe, it, expect, beforeEach } from "vitest";
import { mergeSnapshots } from "./merge";
import {
  createHabit,
  createCompletion,
  createSettings,
  resetFactories,
} from "@/test/factories";
import type { ExportData } from "@/lib/export-import";
import { EXPORT_VERSION } from "@/lib/export-import";

function makeSnapshot(
  overrides: Partial<ExportData["data"]> = {}
): ExportData {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app: "HabitFlow",
    data: {
      habits: [],
      completions: [],
      settings: createSettings(),
      ...overrides,
    },
  };
}

describe("mergeSnapshots", () => {
  beforeEach(() => resetFactories());

  // ── Habits ──────────────────────────────────────────────────────────────

  describe("habits", () => {
    it("keeps local habit when local is newer", () => {
      const id = "11111111-1111-4111-8111-111111111111";
      const localHabit = createHabit({ id, name: "Local Name", updatedAt: "2025-06-02T10:00:00.000Z" });
      const remoteHabit = createHabit({ id, name: "Remote Name", updatedAt: "2025-06-01T10:00:00.000Z" });

      const { merged } = mergeSnapshots(
        makeSnapshot({ habits: [localHabit] }),
        makeSnapshot({ habits: [remoteHabit] })
      );

      expect(merged.data.habits).toHaveLength(1);
      expect(merged.data.habits[0].name).toBe("Local Name");
    });

    it("adopts remote habit when remote is newer", () => {
      const id = "11111111-1111-4111-8111-111111111111";
      const localHabit = createHabit({ id, name: "Local Name", updatedAt: "2025-06-01T10:00:00.000Z" });
      const remoteHabit = createHabit({ id, name: "Remote Name", updatedAt: "2025-06-02T10:00:00.000Z" });

      const { merged, result } = mergeSnapshots(
        makeSnapshot({ habits: [localHabit] }),
        makeSnapshot({ habits: [remoteHabit] })
      );

      expect(merged.data.habits[0].name).toBe("Remote Name");
      expect(result.stats.habitsUpdated).toBe(1);
    });

    it("adds remote-only habits to the merged result", () => {
      const localHabit = createHabit();
      const remoteOnlyHabit = createHabit();

      const { merged, result } = mergeSnapshots(
        makeSnapshot({ habits: [localHabit] }),
        makeSnapshot({ habits: [localHabit, remoteOnlyHabit] })
      );

      expect(merged.data.habits).toHaveLength(2);
      expect(result.stats.habitsUpdated).toBe(1);
    });

    it("preserves local-only habits not present on remote", () => {
      const localOnlyHabit = createHabit();
      const sharedHabit = createHabit();

      const { merged } = mergeSnapshots(
        makeSnapshot({ habits: [localOnlyHabit, sharedHabit] }),
        makeSnapshot({ habits: [sharedHabit] })
      );

      expect(merged.data.habits).toHaveLength(2);
    });
  });

  // ── Completions ─────────────────────────────────────────────────────────

  describe("completions", () => {
    it("unions completions from both sides", () => {
      const habitId = "11111111-1111-4111-8111-111111111111";
      const c1 = createCompletion({ habitId, date: "2025-06-01" });
      const c2 = createCompletion({ habitId, date: "2025-06-02" });

      const { merged } = mergeSnapshots(
        makeSnapshot({ completions: [c1] }),
        makeSnapshot({ completions: [c2] })
      );

      expect(merged.data.completions).toHaveLength(2);
    });

    it("deduplicates completions with the same habitId and date", () => {
      const c = createCompletion();

      const { merged, result } = mergeSnapshots(
        makeSnapshot({ completions: [c] }),
        makeSnapshot({ completions: [c] })
      );

      expect(merged.data.completions).toHaveLength(1);
      expect(result.stats.completionsAdded).toBe(0);
    });

    it("keeps the later completedAt when the same (habitId, date) appears on both sides", () => {
      const habitId = "11111111-1111-4111-8111-111111111111";
      const date = "2025-06-01";
      const earlier = createCompletion({ habitId, date, completedAt: "2025-06-01T07:00:00.000Z" });
      const later = createCompletion({ habitId, date, completedAt: "2025-06-01T09:00:00.000Z" });

      const { merged, result } = mergeSnapshots(
        makeSnapshot({ completions: [earlier] }),
        makeSnapshot({ completions: [later] })
      );

      expect(merged.data.completions).toHaveLength(1);
      expect(merged.data.completions[0].completedAt).toBe("2025-06-01T09:00:00.000Z");
      expect(result.stats.completionsAdded).toBe(1);
    });
  });

  // ── Settings ────────────────────────────────────────────────────────────

  describe("settings", () => {
    it("keeps local settings when local is newer", () => {
      const localSettings = createSettings({ theme: "dark", updatedAt: "2025-06-02T00:00:00.000Z" });
      const remoteSettings = createSettings({ theme: "light", updatedAt: "2025-06-01T00:00:00.000Z" });

      const { merged } = mergeSnapshots(
        makeSnapshot({ settings: localSettings }),
        makeSnapshot({ settings: remoteSettings })
      );

      expect(merged.data.settings.theme).toBe("dark");
    });

    it("adopts remote settings when remote is newer", () => {
      const localSettings = createSettings({ theme: "dark", updatedAt: "2025-06-01T00:00:00.000Z" });
      const remoteSettings = createSettings({ theme: "light", updatedAt: "2025-06-02T00:00:00.000Z" });

      const { merged, result } = mergeSnapshots(
        makeSnapshot({ settings: localSettings }),
        makeSnapshot({ settings: remoteSettings })
      );

      expect(merged.data.settings.theme).toBe("light");
      expect(result.stats.settingsUpdated).toBe(true);
    });
  });

  // ── hasChanges flag ─────────────────────────────────────────────────────

  describe("hasChanges flag", () => {
    it("returns hasChanges=false when local and remote are identical", () => {
      const habit = createHabit();
      const completion = createCompletion({ habitId: habit.id });
      const settings = createSettings();

      const snapshot = makeSnapshot({ habits: [habit], completions: [completion], settings });
      const { result } = mergeSnapshots(snapshot, snapshot);

      expect(result.hasChanges).toBe(false);
    });

    it("returns hasChanges=true when remote has a newer habit", () => {
      const id = "11111111-1111-4111-8111-111111111111";
      const localHabit = createHabit({ id, updatedAt: "2025-06-01T00:00:00.000Z" });
      const remoteHabit = createHabit({ id, name: "Updated", updatedAt: "2025-06-02T00:00:00.000Z" });

      const { result } = mergeSnapshots(
        makeSnapshot({ habits: [localHabit] }),
        makeSnapshot({ habits: [remoteHabit] })
      );

      expect(result.hasChanges).toBe(true);
    });
  });
});

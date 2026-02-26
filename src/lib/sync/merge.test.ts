import { describe, it, expect } from "vitest";
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

  // ── Habits ────────────────────────────────────────────────────────────────

  it("keeps local habit when local is newer", () => {
    const old = "2025-01-01T00:00:00.000Z";
    const recent = "2025-06-01T00:00:00.000Z";
    const id = "11111111-1111-4111-8111-111111111111";

    const localHabit = createHabit({ id, name: "Local Version", updatedAt: recent });
    const remoteHabit = createHabit({ id, name: "Remote Version", updatedAt: old });

    const { merged } = mergeSnapshots(
      makeSnapshot({ habits: [localHabit] }),
      makeSnapshot({ habits: [remoteHabit] })
    );

    expect(merged.data.habits).toHaveLength(1);
    expect(merged.data.habits[0].name).toBe("Local Version");
  });

  it("takes remote habit when remote is newer", () => {
    const old = "2025-01-01T00:00:00.000Z";
    const recent = "2025-06-01T00:00:00.000Z";
    const id = "11111111-1111-4111-8111-111111111111";

    const localHabit = createHabit({ id, name: "Local Version", updatedAt: old });
    const remoteHabit = createHabit({ id, name: "Remote Version", updatedAt: recent });

    const { merged, hadConflict } = mergeSnapshots(
      makeSnapshot({ habits: [localHabit] }),
      makeSnapshot({ habits: [remoteHabit] })
    );

    expect(merged.data.habits[0].name).toBe("Remote Version");
    expect(hadConflict).toBe(true);
  });

  it("adds remote-only habits to merged result", () => {
    const localHabit = createHabit();
    const remoteOnlyHabit = createHabit();

    const { merged, hadConflict } = mergeSnapshots(
      makeSnapshot({ habits: [localHabit] }),
      makeSnapshot({ habits: [localHabit, remoteOnlyHabit] })
    );

    expect(merged.data.habits).toHaveLength(2);
    expect(hadConflict).toBe(true);
  });

  it("preserves local-only habits not present on remote", () => {
    const localOnlyHabit = createHabit();
    const remoteHabit = createHabit();

    const { merged } = mergeSnapshots(
      makeSnapshot({ habits: [localOnlyHabit, remoteHabit] }),
      makeSnapshot({ habits: [remoteHabit] })
    );

    expect(merged.data.habits).toHaveLength(2);
  });

  // ── Completions ───────────────────────────────────────────────────────────

  it("unions completions from both sides", () => {
    const habitId = "11111111-1111-4111-8111-111111111111";
    const c1 = createCompletion({ habitId, date: "2025-01-01" });
    const c2 = createCompletion({ habitId, date: "2025-01-02" });

    const { merged, hadConflict } = mergeSnapshots(
      makeSnapshot({ completions: [c1] }),
      makeSnapshot({ completions: [c2] })
    );

    expect(merged.data.completions).toHaveLength(2);
    expect(hadConflict).toBe(true);
  });

  it("deduplicates completions with the same id", () => {
    const c = createCompletion();

    const { merged } = mergeSnapshots(
      makeSnapshot({ completions: [c] }),
      makeSnapshot({ completions: [c] })
    );

    expect(merged.data.completions).toHaveLength(1);
  });

  it("resolves same (habitId, date) conflict by keeping latest completedAt", () => {
    const habitId = "11111111-1111-4111-8111-111111111111";
    const date = "2025-01-15";
    const older = createCompletion({
      habitId,
      date,
      completedAt: "2025-01-15T08:00:00.000Z",
    });
    const newer = createCompletion({
      habitId,
      date,
      completedAt: "2025-01-15T12:00:00.000Z",
    });

    const { merged } = mergeSnapshots(
      makeSnapshot({ completions: [older] }),
      makeSnapshot({ completions: [newer] })
    );

    expect(merged.data.completions).toHaveLength(1);
    expect(merged.data.completions[0].completedAt).toBe("2025-01-15T12:00:00.000Z");
  });

  // ── Settings ──────────────────────────────────────────────────────────────

  it("keeps local settings when local is newer", () => {
    const localSettings = createSettings({
      theme: "dark",
      updatedAt: "2025-06-01T00:00:00.000Z",
    });
    const remoteSettings = createSettings({
      theme: "light",
      updatedAt: "2025-01-01T00:00:00.000Z",
    });

    const { merged } = mergeSnapshots(
      makeSnapshot({ settings: localSettings }),
      makeSnapshot({ settings: remoteSettings })
    );

    expect(merged.data.settings.theme).toBe("dark");
  });

  it("takes remote settings when remote is newer", () => {
    const localSettings = createSettings({
      theme: "dark",
      updatedAt: "2025-01-01T00:00:00.000Z",
    });
    const remoteSettings = createSettings({
      theme: "light",
      updatedAt: "2025-06-01T00:00:00.000Z",
    });

    const { merged, hadConflict } = mergeSnapshots(
      makeSnapshot({ settings: localSettings }),
      makeSnapshot({ settings: remoteSettings })
    );

    expect(merged.data.settings.theme).toBe("light");
    expect(hadConflict).toBe(true);
  });

  // ── No conflict ───────────────────────────────────────────────────────────

  it("reports no conflict when snapshots are identical", () => {
    const habit = createHabit();
    const completion = createCompletion({ habitId: habit.id });
    const settings = createSettings();

    const snapshot = makeSnapshot({ habits: [habit], completions: [completion], settings });

    const { hadConflict } = mergeSnapshots(snapshot, { ...snapshot });

    expect(hadConflict).toBe(false);
  });
});

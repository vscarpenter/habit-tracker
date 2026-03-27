import { describe, it, expect, beforeEach } from "vitest";
import {
  createHabit,
  createCompletion,
  createSettings,
  resetFactories,
} from "@/test/factories";
import {
  EXPORT_VERSION,
  validateImportData,
  escapeCSVField,
  toCSVRow,
  buildHabitCSVRow,
  buildCompletionCSVRow,
  type ExportData,
} from "./export-import";

beforeEach(() => {
  resetFactories();
});

function buildValidPayload(
  overrides: Partial<ExportData> = {}
): ExportData {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app: "HabitFlow",
    data: {
      habits: [createHabit()],
      completions: [createCompletion()],
      settings: createSettings(),
    },
    ...overrides,
  };
}

describe("validateImportData", () => {
  it("accepts a valid payload", () => {
    const payload = buildValidPayload();
    const result = validateImportData(payload);

    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error("Expected valid result");
    expect(result.data).toBeDefined();
    expect(result.data.version).toBe(EXPORT_VERSION);
  });

  it("rejects when version is missing", () => {
    const payload = buildValidPayload();
    // as any: intentionally constructing an invalid payload to test validation rejection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).version;

    const result = validateImportData(payload);
    expect(result.valid).toBe(false);
    if (result.valid) throw new Error("Expected invalid result");
    expect(result.errors).toBeDefined();
    expect(result.errors.some((e: string) => e.includes("version"))).toBe(true);
  });

  it("rejects a malformed habit with specific error", () => {
    const badHabit = createHabit({ name: "" }); // name min(1) violated
    const payload = buildValidPayload({
      data: {
        habits: [badHabit],
        completions: [],
        settings: createSettings(),
      },
    });

    const result = validateImportData(payload);
    expect(result.valid).toBe(false);
    if (result.valid) throw new Error("Expected invalid result");
    expect(result.errors.some((e: string) => e.includes("name") || e.includes("Name"))).toBe(true);
  });

  it("rejects non-object input", () => {
    const result = validateImportData("not an object");
    expect(result.valid).toBe(false);
  });

  it("rejects wrong app identifier", () => {
    const payload = buildValidPayload();
    // as any: intentionally constructing a payload with wrong app identifier to test rejection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload as any).app = "SomeOtherApp";

    const result = validateImportData(payload);
    expect(result.valid).toBe(false);
  });

  it("round-trip: build valid → validate → passes", () => {
    const payload = buildValidPayload();
    const result = validateImportData(payload);

    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error("Expected valid result");
    expect(result.data.data.habits).toHaveLength(1);
    expect(result.data.data.completions).toHaveLength(1);
  });
});

describe("CSV export helpers", () => {
  describe("escapeCSVField", () => {
    it("returns plain values unchanged", () => {
      expect(escapeCSVField("hello")).toBe("hello");
    });

    it("wraps values containing commas in quotes", () => {
      expect(escapeCSVField("hello, world")).toBe('"hello, world"');
    });

    it("escapes double quotes by doubling them", () => {
      expect(escapeCSVField('say "hi"')).toBe('"say ""hi"""');
    });

    it("wraps values containing newlines in quotes", () => {
      expect(escapeCSVField("line1\nline2")).toBe('"line1\nline2"');
    });

    it("handles carriage returns", () => {
      expect(escapeCSVField("line1\rline2")).toBe('"line1\rline2"');
    });

    it("handles empty strings", () => {
      expect(escapeCSVField("")).toBe("");
    });
  });

  describe("toCSVRow", () => {
    it("joins fields with commas", () => {
      expect(toCSVRow(["a", "b", "c"])).toBe("a,b,c");
    });

    it("escapes fields that need it", () => {
      expect(toCSVRow(["normal", "has, comma", "plain"])).toBe('normal,"has, comma",plain');
    });
  });

  describe("buildHabitCSVRow", () => {
    it("includes all habit fields in correct order", () => {
      const habit = createHabit({
        name: "Morning Run",
        description: "Run 5k",
        category: "fitness",
      });
      const row = buildHabitCSVRow(habit);
      const fields = row.split(",");

      expect(fields[0]).toBe(habit.id);
      expect(fields[1]).toBe("Morning Run");
      expect(fields[2]).toBe("Run 5k");
    });

    it("handles missing optional fields", () => {
      const habit = createHabit({ description: undefined, category: undefined });
      const row = buildHabitCSVRow(habit);

      // description and category should be empty strings
      expect(row).toContain(",,");
    });

    it("escapes habit names containing commas", () => {
      const habit = createHabit({ name: "Read, Write, Code" });
      const row = buildHabitCSVRow(habit);

      expect(row).toContain('"Read, Write, Code"');
    });
  });

  describe("buildCompletionCSVRow", () => {
    it("includes denormalized habit name", () => {
      const habit = createHabit({ name: "Meditate" });
      const completion = createCompletion({ habitId: habit.id });
      const nameMap = new Map([[habit.id, habit.name]]);

      const row = buildCompletionCSVRow(completion, nameMap);

      expect(row).toContain("Meditate");
    });

    it("uses 'Unknown' for missing habit name", () => {
      const completion = createCompletion({ habitId: "nonexistent" });
      const nameMap = new Map<string, string>();

      const row = buildCompletionCSVRow(completion, nameMap);

      expect(row).toContain("Unknown");
    });

    it("escapes notes containing special characters", () => {
      const habit = createHabit();
      const completion = createCompletion({
        habitId: habit.id,
        note: 'Felt "great", ran fast',
      });
      const nameMap = new Map([[habit.id, habit.name]]);

      const row = buildCompletionCSVRow(completion, nameMap);

      expect(row).toContain('"Felt ""great"", ran fast"');
    });
  });
});

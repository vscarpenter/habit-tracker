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
    if (!result.valid) return;
    expect(result.data).toBeDefined();
    expect(result.data.version).toBe(EXPORT_VERSION);
  });

  it("rejects when version is missing", () => {
    const payload = buildValidPayload();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (payload as any).version;

    const result = validateImportData(payload);
    expect(result.valid).toBe(false);
    if (result.valid) return;
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
    if (result.valid) return;
    expect(result.errors.some((e: string) => e.includes("name") || e.includes("Name"))).toBe(true);
  });

  it("rejects non-object input", () => {
    const result = validateImportData("not an object");
    expect(result.valid).toBe(false);
  });

  it("rejects wrong app identifier", () => {
    const payload = buildValidPayload();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload as any).app = "SomeOtherApp";

    const result = validateImportData(payload);
    expect(result.valid).toBe(false);
  });

  it("round-trip: build valid → validate → passes", () => {
    const payload = buildValidPayload();
    const result = validateImportData(payload);

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.data.data.habits).toHaveLength(1);
    expect(result.data.data.completions).toHaveLength(1);
  });
});

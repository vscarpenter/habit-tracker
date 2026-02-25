import { describe, it, expect, beforeEach } from "vitest";
import { habitSchema, habitCompletionSchema, userSettingsSchema } from "./schemas";
import { createHabit, createCompletion, createSettings, resetFactories } from "@/test/factories";

beforeEach(() => {
  resetFactories();
});

describe("habitSchema", () => {
  it("validates a correct habit", () => {
    const habit = createHabit();
    expect(() => habitSchema.parse(habit)).not.toThrow();
  });

  it("rejects empty name", () => {
    const habit = createHabit({ name: "" });
    expect(() => habitSchema.parse(habit)).toThrow();
  });

  it("rejects name over 100 chars", () => {
    const habit = createHabit({ name: "a".repeat(101) });
    expect(() => habitSchema.parse(habit)).toThrow();
  });

  it("rejects invalid color format", () => {
    const habit = createHabit({ color: "not-a-color" });
    expect(() => habitSchema.parse(habit)).toThrow();
  });

  it("requires targetDays for specific_days frequency", () => {
    const habit = createHabit({
      frequency: "specific_days",
      targetDays: undefined,
    });
    expect(() => habitSchema.parse(habit)).toThrow();
  });

  it("requires targetCount for x_per_week frequency", () => {
    const habit = createHabit({
      frequency: "x_per_week",
      targetCount: undefined,
    });
    expect(() => habitSchema.parse(habit)).toThrow();
  });

  it("accepts valid specific_days with targetDays", () => {
    const habit = createHabit({
      frequency: "specific_days",
      targetDays: [1, 3, 5],
    });
    expect(() => habitSchema.parse(habit)).not.toThrow();
  });
});

describe("habitCompletionSchema", () => {
  it("validates a correct completion", () => {
    const completion = createCompletion();
    expect(() => habitCompletionSchema.parse(completion)).not.toThrow();
  });

  it("rejects invalid date format", () => {
    const completion = createCompletion({ date: "02/15/2026" });
    expect(() => habitCompletionSchema.parse(completion)).toThrow();
  });

  it("rejects note over 250 chars", () => {
    const completion = createCompletion({ note: "a".repeat(251) });
    expect(() => habitCompletionSchema.parse(completion)).toThrow();
  });

  it("rejects impossible calendar dates", () => {
    // Feb 30 doesn't exist
    const completion = createCompletion({ date: "2026-02-30" });
    expect(() => habitCompletionSchema.parse(completion)).toThrow();
  });

  it("rejects month 13", () => {
    const completion = createCompletion({ date: "2026-13-01" });
    expect(() => habitCompletionSchema.parse(completion)).toThrow();
  });
});

describe("userSettingsSchema", () => {
  it("validates correct settings", () => {
    const settings = createSettings();
    expect(() => userSettingsSchema.parse(settings)).not.toThrow();
  });

  it("rejects invalid theme", () => {
    const settings = createSettings({ theme: "purple" as "light" });
    expect(() => userSettingsSchema.parse(settings)).toThrow();
  });

  it("rejects invalid weekStartsOn", () => {
    const settings = createSettings({ weekStartsOn: 3 as 0 });
    expect(() => userSettingsSchema.parse(settings)).toThrow();
  });
});

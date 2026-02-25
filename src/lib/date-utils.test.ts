import { describe, it, expect, beforeEach } from "vitest";
import {
  getWeekStart,
  getWeekDates,
  buildWeeklyPatternData,
  buildMonthlyCompletionData,
  isHabitScheduledForDate,
  frequencyLabel,
} from "./date-utils";
import { resetFactories } from "@/test/factories";
import type { Habit, HabitCompletion } from "@/types";

beforeEach(() => {
  resetFactories();
});

// --- getWeekStart ---

describe("getWeekStart", () => {
  it("returns Sunday for weekStartsOn=0", () => {
    // 2026-02-17 is a Tuesday
    const result = getWeekStart("2026-02-17", 0);
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-15"); // Sunday
  });

  it("returns Monday for weekStartsOn=1", () => {
    const result = getWeekStart("2026-02-17", 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-16"); // Monday
  });

  it("returns same day when date is already the week start", () => {
    const result = getWeekStart("2026-02-15", 0); // Sunday
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-15");
  });

  it("defaults to weekStartsOn=0", () => {
    const result = getWeekStart("2026-02-17");
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-15");
  });
});

// --- getWeekDates ---

describe("getWeekDates", () => {
  it("returns 7 consecutive date strings", () => {
    const start = new Date(2026, 1, 15); // Feb 15 (Sunday)
    const dates = getWeekDates(start);
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe("2026-02-15");
    expect(dates[6]).toBe("2026-02-21");
  });

  it("handles month boundaries", () => {
    const start = new Date(2026, 0, 26); // Jan 26 (Monday)
    const dates = getWeekDates(start);
    expect(dates[0]).toBe("2026-01-26");
    expect(dates[5]).toBe("2026-01-31");
    expect(dates[6]).toBe("2026-02-01");
  });
});

// --- buildWeeklyPatternData ---

describe("buildWeeklyPatternData", () => {
  it("returns 7 entries with correct day names", () => {
    const result = buildWeeklyPatternData([]);
    expect(result).toHaveLength(7);
    expect(result.map((r) => r.day)).toEqual([
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
    ]);
  });

  it("counts all zeros for empty completions", () => {
    const result = buildWeeklyPatternData([]);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });

  it("counts completions by day of week", () => {
    const completions: HabitCompletion[] = [
      { id: "1", habitId: "h1", date: "2026-02-16", completedAt: "" }, // Monday
      { id: "2", habitId: "h1", date: "2026-02-17", completedAt: "" }, // Tuesday
      { id: "3", habitId: "h1", date: "2026-02-23", completedAt: "" }, // Monday
    ];
    const result = buildWeeklyPatternData(completions);
    expect(result.find((r) => r.day === "Mon")!.count).toBe(2);
    expect(result.find((r) => r.day === "Tue")!.count).toBe(1);
    expect(result.find((r) => r.day === "Sun")!.count).toBe(0);
  });
});

// --- buildMonthlyCompletionData ---

describe("buildMonthlyCompletionData", () => {
  it("returns the requested number of months", () => {
    const result = buildMonthlyCompletionData([], 6);
    expect(result).toHaveLength(6);
  });

  it("counts completions in the correct month bucket", () => {
    // Build thisMonth from the same Date constructor the function uses internally,
    // ensuring alignment even on month boundaries.
    const anchor = new Date();
    const thisMonth = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
    const completions: HabitCompletion[] = [
      { id: "1", habitId: "h1", date: `${thisMonth}-05`, completedAt: "" },
      { id: "2", habitId: "h1", date: `${thisMonth}-10`, completedAt: "" },
    ];
    const result = buildMonthlyCompletionData(completions, 3);
    const currentEntry = result[result.length - 1];
    expect(currentEntry.count).toBe(2);
  });

  it("returns zero for months with no completions", () => {
    const result = buildMonthlyCompletionData([], 3);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });
});

// --- isHabitScheduledForDate ---

describe("isHabitScheduledForDate", () => {
  const baseHabit: Habit = {
    id: "h1",
    name: "Test",
    icon: "🧪",
    color: "#3b82f6",
    frequency: "daily",
    sortOrder: 0,
    isArchived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("returns true for daily habits on any day", () => {
    expect(isHabitScheduledForDate(baseHabit, "2026-02-17")).toBe(true); // Tuesday
    expect(isHabitScheduledForDate(baseHabit, "2026-02-15")).toBe(true); // Sunday
  });

  it("returns true for weekday habits on weekdays only", () => {
    const habit = { ...baseHabit, frequency: "weekdays" as const };
    expect(isHabitScheduledForDate(habit, "2026-02-17")).toBe(true);  // Tuesday
    expect(isHabitScheduledForDate(habit, "2026-02-15")).toBe(false); // Sunday
  });

  it("returns true for weekend habits on weekends only", () => {
    const habit = { ...baseHabit, frequency: "weekends" as const };
    expect(isHabitScheduledForDate(habit, "2026-02-15")).toBe(true);  // Sunday
    expect(isHabitScheduledForDate(habit, "2026-02-17")).toBe(false); // Tuesday
  });

  it("respects specific_days", () => {
    const habit = { ...baseHabit, frequency: "specific_days" as const, targetDays: [1, 3, 5] };
    expect(isHabitScheduledForDate(habit, "2026-02-16")).toBe(true);  // Monday=1
    expect(isHabitScheduledForDate(habit, "2026-02-17")).toBe(false); // Tuesday=2
  });

  it("returns true for x_per_week on any day", () => {
    const habit = { ...baseHabit, frequency: "x_per_week" as const, targetCount: 3 };
    expect(isHabitScheduledForDate(habit, "2026-02-15")).toBe(true); // Sunday
    expect(isHabitScheduledForDate(habit, "2026-02-17")).toBe(true); // Tuesday
    expect(isHabitScheduledForDate(habit, "2026-02-21")).toBe(true); // Saturday
  });
});

// --- frequencyLabel ---

describe("frequencyLabel", () => {
  const baseHabit: Habit = {
    id: "h1",
    name: "Test",
    icon: "🧪",
    color: "#3b82f6",
    frequency: "daily",
    sortOrder: 0,
    isArchived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it('returns "Every day" for daily', () => {
    expect(frequencyLabel(baseHabit)).toBe("Every day");
  });

  it('returns "Weekdays" for weekdays', () => {
    expect(frequencyLabel({ ...baseHabit, frequency: "weekdays" })).toBe("Weekdays");
  });

  it("formats x_per_week", () => {
    expect(
      frequencyLabel({ ...baseHabit, frequency: "x_per_week", targetCount: 3 })
    ).toBe("3x per week");
  });

  it("formats specific_days", () => {
    const label = frequencyLabel({
      ...baseHabit,
      frequency: "specific_days",
      targetDays: [1, 3, 5],
    });
    expect(label).toBe("Mon, Wed, Fri");
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { format, subDays, parseISO } from "date-fns";
import {
  computeHabitStats,
  computeOverallStats,
  buildDailyCompletionTrend,
  buildAggregateHeatmapData,
  buildCategoryBreakdown,
  buildLeaderboard,
} from "./stats-utils";
import { createHabit, createCompletion, resetFactories } from "@/test/factories";

beforeEach(() => {
  resetFactories();
});

const TODAY = "2026-02-17";

function daysAgo(n: number): string {
  return format(subDays(parseISO(TODAY), n), "yyyy-MM-dd");
}

// ── computeHabitStats ──────────────────────────────────

describe("computeHabitStats", () => {
  it("calculates streaks for a daily habit", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(5)}T00:00:00.000Z`,
    });
    // Completed last 3 days including today
    const completions = [0, 1, 2].map((i) =>
      createCompletion({ habitId: habit.id, date: daysAgo(i) })
    );

    const result = computeHabitStats(habit, completions, TODAY);
    expect(result.currentStreak).toBe(3);
    expect(result.totalCompletions).toBe(3);
    expect(result.completionRate).toBe(50); // 3 of 6 days
  });

  it("does not break current streak if today is not yet completed", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(4)}T00:00:00.000Z`,
    });
    // Completed yesterday and day before, but NOT today
    const completions = [1, 2].map((i) =>
      createCompletion({ habitId: habit.id, date: daysAgo(i) })
    );

    const result = computeHabitStats(habit, completions, TODAY);
    expect(result.currentStreak).toBe(2);
  });

  it("skips non-scheduled days for weekday habits", () => {
    // 2026-02-17 is Tue. Weekdays: 17(Tue), 16(Mon), 13(Fri), 12(Thu), 11(Wed)
    // daysAgo: 0=Tue, 1=Mon, 2=Sun, 3=Sat, 4=Fri, 5=Thu, 6=Wed
    const habit = createHabit({
      frequency: "weekdays",
      createdAt: `${daysAgo(6)}T00:00:00.000Z`,
    });
    // Complete all weekdays: indices 0,1,4,5,6 (skip weekend at 2,3)
    const weekdayDates = [0, 1, 4, 5, 6].map((i) => daysAgo(i));
    const completions = weekdayDates.map((d) =>
      createCompletion({ habitId: habit.id, date: d })
    );

    const result = computeHabitStats(habit, completions, TODAY);
    expect(result.currentStreak).toBe(5);
    expect(result.completionRate).toBe(100);
  });

  it("returns zeros for empty completions", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(3)}T00:00:00.000Z`,
    });

    const result = computeHabitStats(habit, [], TODAY);
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(0);
    expect(result.totalCompletions).toBe(0);
    expect(result.completionRate).toBe(0);
  });

  it("tracks best streak separately from current", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(9)}T00:00:00.000Z`,
    });
    // Old streak of 5 (days 9-5), gap at day 4, new streak of 2 (days 1-0)
    const completions = [0, 1, 5, 6, 7, 8, 9].map((i) =>
      createCompletion({ habitId: habit.id, date: daysAgo(i) })
    );

    const result = computeHabitStats(habit, completions, TODAY);
    expect(result.currentStreak).toBe(2);
    expect(result.bestStreak).toBe(5);
  });

  it("filters completions to the given habit", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(2)}T00:00:00.000Z`,
    });
    const otherHabitCompletion = createCompletion({
      habitId: "other-id",
      date: daysAgo(0),
    });
    const myCompletion = createCompletion({
      habitId: habit.id,
      date: daysAgo(0),
    });

    const result = computeHabitStats(
      habit,
      [otherHabitCompletion, myCompletion],
      TODAY
    );
    expect(result.totalCompletions).toBe(1);
  });
});

// ── computeOverallStats ────────────────────────────────

describe("computeOverallStats", () => {
  it("aggregates across multiple habits", () => {
    const h1 = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(3)}T00:00:00.000Z`,
    });
    const h2 = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(3)}T00:00:00.000Z`,
    });
    const completions = [
      // h1: 3 of 4 days
      ...[0, 1, 2].map((i) =>
        createCompletion({ habitId: h1.id, date: daysAgo(i) })
      ),
      // h2: 1 of 4 days
      createCompletion({ habitId: h2.id, date: daysAgo(0) }),
    ];

    const result = computeOverallStats([h1, h2], completions, TODAY);
    expect(result.totalActiveHabits).toBe(2);
    expect(result.totalCompletions).toBe(4);
    expect(result.bestCurrentStreak).toBe(3); // h1's streak
    // h1 rate = 75%, h2 rate = 25% → avg = 50%
    expect(result.overallCompletionRate).toBe(50);
  });

  it("excludes archived habits", () => {
    const active = createHabit({
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });
    const archived = createHabit({
      isArchived: true,
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });

    const result = computeOverallStats([active, archived], [], TODAY);
    expect(result.totalActiveHabits).toBe(1);
  });

  it("returns zeros for empty habits", () => {
    const result = computeOverallStats([], [], TODAY);
    expect(result.totalActiveHabits).toBe(0);
    expect(result.overallCompletionRate).toBe(0);
  });
});

// ── buildDailyCompletionTrend ──────────────────────────

describe("buildDailyCompletionTrend", () => {
  it("returns one entry per day, zero-filled", () => {
    const entries = buildDailyCompletionTrend([], daysAgo(6), TODAY);
    expect(entries).toHaveLength(7);
    expect(entries.every((e) => e.count === 0)).toBe(true);
  });

  it("counts multiple completions on the same day", () => {
    const completions = [
      createCompletion({ date: TODAY }),
      createCompletion({ date: TODAY }),
      createCompletion({ date: daysAgo(1) }),
    ];

    const entries = buildDailyCompletionTrend(completions, daysAgo(2), TODAY);
    expect(entries).toHaveLength(3);
    const todayEntry = entries.find((e) => e.date === TODAY);
    expect(todayEntry?.count).toBe(2);
  });

  it("excludes completions outside range", () => {
    const completions = [createCompletion({ date: daysAgo(10) })];
    const entries = buildDailyCompletionTrend(completions, daysAgo(2), TODAY);
    expect(entries.every((e) => e.count === 0)).toBe(true);
  });
});

// ── buildAggregateHeatmapData ──────────────────────────

describe("buildAggregateHeatmapData", () => {
  it("returns 52 columns of 7 rows each", () => {
    const { grid } = buildAggregateHeatmapData([], TODAY);
    expect(grid).toHaveLength(52);
    for (const col of grid) {
      expect(col).toHaveLength(7);
    }
  });

  it("counts per-day completions (not binary)", () => {
    const completions = [
      createCompletion({ date: TODAY }),
      createCompletion({ date: TODAY }),
      createCompletion({ date: TODAY }),
    ];
    const { grid, maxCount } = buildAggregateHeatmapData(
      completions,
      TODAY
    );

    // Find today's cell in the last column
    const lastCol = grid[grid.length - 1];
    const todayCell = lastCol.find((c) => c.date === TODAY);
    expect(todayCell?.count).toBe(3);
    expect(maxCount).toBe(3);
  });
});

// ── buildCategoryBreakdown ─────────────────────────────

describe("buildCategoryBreakdown", () => {
  it("groups habits by category", () => {
    const h1 = createHabit({
      category: "Health",
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });
    const h2 = createHabit({
      category: "Health",
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });
    const h3 = createHabit({
      category: "Learning",
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });

    const result = buildCategoryBreakdown([h1, h2, h3], [], TODAY);
    expect(result).toHaveLength(2);
    const health = result.find((r) => r.category === "Health");
    expect(health?.habitCount).toBe(2);
  });

  it("uses 'Uncategorized' for habits without category", () => {
    const h = createHabit({
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });
    const result = buildCategoryBreakdown([h], [], TODAY);
    expect(result[0].category).toBe("Uncategorized");
  });

  it("excludes archived habits", () => {
    const h = createHabit({
      isArchived: true,
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });
    const result = buildCategoryBreakdown([h], [], TODAY);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for no habits", () => {
    const result = buildCategoryBreakdown([], [], TODAY);
    expect(result).toHaveLength(0);
  });
});

// ── buildLeaderboard ───────────────────────────────────

describe("buildLeaderboard", () => {
  it("sorts by completion rate descending", () => {
    const h1 = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(3)}T00:00:00.000Z`,
    });
    const h2 = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(3)}T00:00:00.000Z`,
    });
    const completions = [
      // h1: 1 completion
      createCompletion({ habitId: h1.id, date: daysAgo(0) }),
      // h2: 3 completions
      ...[0, 1, 2].map((i) =>
        createCompletion({ habitId: h2.id, date: daysAgo(i) })
      ),
    ];

    const result = buildLeaderboard([h1, h2], completions, TODAY);
    expect(result[0].habit.id).toBe(h2.id);
    expect(result[1].habit.id).toBe(h1.id);
  });

  it("handles zero completions", () => {
    const h = createHabit({
      createdAt: `${daysAgo(3)}T00:00:00.000Z`,
    });
    const result = buildLeaderboard([h], [], TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].completionRate).toBe(0);
    expect(result[0].currentStreak).toBe(0);
  });

  it("excludes archived habits", () => {
    const h = createHabit({
      isArchived: true,
      createdAt: `${daysAgo(1)}T00:00:00.000Z`,
    });
    const result = buildLeaderboard([h], [], TODAY);
    expect(result).toHaveLength(0);
  });
});

// ── Edge case: habit created today ────────────────────

describe("computeHabitStats — edge cases", () => {
  it("handles habit created today with no completions", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${TODAY}T00:00:00.000Z`,
    });
    const result = computeHabitStats(habit, [], TODAY);
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.totalCompletions).toBe(0);
  });

  it("handles habit created today with today completed", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${TODAY}T00:00:00.000Z`,
    });
    const completions = [createCompletion({ habitId: habit.id, date: TODAY })];
    const result = computeHabitStats(habit, completions, TODAY);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
    expect(result.completionRate).toBe(100);
  });

  it("handles single-day date range in trend", () => {
    const entries = buildDailyCompletionTrend([], TODAY, TODAY);
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe(TODAY);
    expect(entries[0].count).toBe(0);
  });
});

// ── computeOverallStats — single habit ────────────────

describe("computeOverallStats — single habit", () => {
  it("returns stats for a single active habit", () => {
    const habit = createHabit({
      frequency: "daily",
      createdAt: `${daysAgo(2)}T00:00:00.000Z`,
    });
    const completions = [0, 1, 2].map((i) =>
      createCompletion({ habitId: habit.id, date: daysAgo(i) })
    );
    const result = computeOverallStats([habit], completions, TODAY);
    expect(result.totalActiveHabits).toBe(1);
    expect(result.totalCompletions).toBe(3);
    expect(result.overallCompletionRate).toBe(100);
  });
});

// ── buildAggregateHeatmapData — weekStartsOn=1 ───────

describe("buildAggregateHeatmapData — weekStartsOn=1", () => {
  it("returns 52 columns with Monday start", () => {
    const { grid } = buildAggregateHeatmapData([], TODAY, 1);
    expect(grid).toHaveLength(52);
    for (const col of grid) {
      expect(col).toHaveLength(7);
    }
  });
});

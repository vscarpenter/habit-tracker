import {
  parseISO,
  format,
  subDays,
  differenceInCalendarDays,
} from "date-fns";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit, HabitCompletion, HabitChain } from "@/types";

// ── Types ──────────────────────────────────────────────

export interface DateRangePreset {
  label: string;
  value: string;
  days: number; // 0 = "all time"
}

export interface HabitStatsResult {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
}

export interface OverallStatsResult {
  totalActiveHabits: number;
  overallCompletionRate: number;
  bestCurrentStreak: number;
  totalCompletions: number;
}

// ── Presets ─────────────────────────────────────────────

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: "7D", value: "7d", days: 7 },
  { label: "30D", value: "30d", days: 30 },
  { label: "90D", value: "90d", days: 90 },
  { label: "1Y", value: "1y", days: 365 },
  { label: "All", value: "all", days: 0 },
];

// ── Shared Helpers ───────────────────────────────────────

export function getActiveHabits(habits: Habit[]): Habit[] {
  return habits.filter((habit) => !habit.isArchived);
}

// ── Streak / Rate Helpers ──────────────────────────────

/** Walks backwards from today; skips today if not yet completed. */
function calcCurrentStreak(
  habit: Habit,
  completedDates: Set<string>,
  today: string,
  daysSinceCreation: number
): number {
  let streak = 0;
  for (let i = 0; i <= daysSinceCreation; i++) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!isHabitScheduledForDate(habit, dateStr)) continue;

    if (completedDates.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      continue; // Today not yet completed — don't break streak
    } else {
      break;
    }
  }
  return streak;
}

/** Walks forward from creation to find the longest consecutive run. */
function calcBestStreak(
  habit: Habit,
  completedDates: Set<string>,
  today: string,
  daysSinceCreation: number
): number {
  let best = 0;
  let run = 0;
  for (let i = daysSinceCreation; i >= 0; i--) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!isHabitScheduledForDate(habit, dateStr)) continue;

    if (completedDates.has(dateStr)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

/** Counts scheduled days and completed scheduled days. */
function calcCompletionRate(
  habit: Habit,
  completedDates: Set<string>,
  today: string,
  daysSinceCreation: number
): number {
  let scheduled = 0;
  let completed = 0;
  for (let i = 0; i <= daysSinceCreation; i++) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!isHabitScheduledForDate(habit, dateStr)) continue;
    scheduled++;
    if (completedDates.has(dateStr)) completed++;
  }
  return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
}

// ── Per-Habit Stats ────────────────────────────────────

export function computeHabitStats(
  habit: Habit,
  completions: HabitCompletion[],
  today: string
): HabitStatsResult {
  const habitCompletions = completions.filter((c) => c.habitId === habit.id);
  const completedDates = new Set(habitCompletions.map((c) => c.date));

  const createdDate = habit.createdAt.split("T")[0];
  const daysSinceCreation = differenceInCalendarDays(
    parseISO(today),
    parseISO(createdDate)
  );

  return {
    currentStreak: calcCurrentStreak(habit, completedDates, today, daysSinceCreation),
    bestStreak: calcBestStreak(habit, completedDates, today, daysSinceCreation),
    totalCompletions: habitCompletions.length,
    completionRate: calcCompletionRate(habit, completedDates, today, daysSinceCreation),
  };
}

// ── Quantitative Helpers ─────────────────────────────────

/**
 * Determines if a quantitative habit is "complete" for a given completion.
 * Complete when value >= targetValue, or any value if no target is set.
 */
export function isQuantitativeComplete(
  habit: Habit,
  completion: HabitCompletion | undefined
): boolean {
  if (!completion || completion.value == null) return false;
  if (habit.targetValue == null) return completion.value > 0;
  return completion.value >= habit.targetValue;
}

export interface QuantitativeStats {
  totalValue: number;
  personalBest: number;
  dailyAverage: number;
  daysLogged: number;
}

/**
 * Calculates stats for a quantitative habit from its completions.
 */
export function calculateQuantitativeStats(
  completions: HabitCompletion[]
): QuantitativeStats {
  const withValue = completions.filter(
    (c): c is HabitCompletion & { value: number } => c.value != null
  );

  if (withValue.length === 0) {
    return { totalValue: 0, personalBest: 0, dailyAverage: 0, daysLogged: 0 };
  }

  const totalValue = withValue.reduce((sum, c) => sum + c.value, 0);
  const personalBest = Math.max(...withValue.map((c) => c.value));
  const dailyAverage = Math.round((totalValue / withValue.length) * 10) / 10;

  return { totalValue, personalBest, dailyAverage, daysLogged: withValue.length };
}

// ── Effort Stats ────────────────────────────────────────

/**
 * Calculates the average effort rating from completions with non-null effort.
 * Returns null if no effort ratings exist.
 */
export function calculateAverageEffort(
  completions: HabitCompletion[]
): number | null {
  const withEffort = completions.filter(
    (c): c is HabitCompletion & { effort: number } =>
      c.effort != null
  );
  if (withEffort.length === 0) return null;

  const sum = withEffort.reduce((acc, c) => acc + c.effort, 0);
  return Math.round((sum / withEffort.length) * 10) / 10;
}

// ── Overall / Aggregate Stats ──────────────────────────

export function computeOverallStats(
  habits: Habit[],
  completions: HabitCompletion[],
  today: string
): OverallStatsResult {
  const activeHabits = getActiveHabits(habits);
  if (activeHabits.length === 0) {
    return {
      totalActiveHabits: 0,
      overallCompletionRate: 0,
      bestCurrentStreak: 0,
      totalCompletions: 0,
    };
  }

  let totalCompletions = 0;
  let bestCurrentStreak = 0;
  let weightedRateSum = 0;
  let habitCount = 0;

  for (const habit of activeHabits) {
    const stats = computeHabitStats(habit, completions, today);
    totalCompletions += stats.totalCompletions;
    bestCurrentStreak = Math.max(bestCurrentStreak, stats.currentStreak);
    weightedRateSum += stats.completionRate;
    habitCount++;
  }

  return {
    totalActiveHabits: activeHabits.length,
    overallCompletionRate:
      habitCount > 0 ? Math.round(weightedRateSum / habitCount) : 0,
    bestCurrentStreak,
    totalCompletions,
  };
}

// ── Chain Streak ────────────────────────────────────────

export interface ChainStreakResult {
  currentStreak: number;
  bestStreak: number;
}

/**
 * Calculates chain-level streaks. A chain day is "complete" when every
 * habit in the chain is completed for that day.
 */
export function calculateChainStreak(
  _chain: HabitChain,
  habits: Habit[],
  completions: HabitCompletion[],
  today: string
): ChainStreakResult {
  if (habits.length === 0) return { currentStreak: 0, bestStreak: 0 };

  // Find earliest creation date among chain habits
  const earliestCreated = habits.reduce((min, h) => {
    const d = h.createdAt.split("T")[0];
    return d < min ? d : min;
  }, habits[0].createdAt.split("T")[0]);

  const daysSinceCreation = differenceInCalendarDays(
    parseISO(today),
    parseISO(earliestCreated)
  );

  // Build per-habit completion sets
  const habitCompletionSets = new Map<string, Set<string>>();
  for (const h of habits) {
    habitCompletionSets.set(h.id, new Set());
  }
  for (const c of completions) {
    habitCompletionSets.get(c.habitId)?.add(c.date);
  }

  function isChainCompleteOnDate(dateStr: string): boolean {
    return habits.every((habit) => {
      if (!isHabitScheduledForDate(habit, dateStr)) return true;
      return habitCompletionSets.get(habit.id)?.has(dateStr) ?? false;
    });
  }

  function anyHabitScheduled(dateStr: string): boolean {
    return habits.some((h) => isHabitScheduledForDate(h, dateStr));
  }

  // Current streak (walks backward)
  let currentStreak = 0;
  for (let i = 0; i <= daysSinceCreation; i++) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!anyHabitScheduled(dateStr)) continue;

    if (isChainCompleteOnDate(dateStr)) {
      currentStreak++;
    } else if (i === 0) {
      continue; // Today not yet complete — don't break
    } else {
      break;
    }
  }

  // Best streak (walks forward)
  let bestStreak = 0;
  let run = 0;
  for (let i = daysSinceCreation; i >= 0; i--) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!anyHabitScheduled(dateStr)) continue;

    if (isChainCompleteOnDate(dateStr)) {
      run++;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  return { currentStreak, bestStreak };
}

import {
  parseISO,
  format,
  subDays,
  differenceInCalendarDays,
  startOfWeek,
  eachDayOfInterval,
  subWeeks,
  getDay,
} from "date-fns";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit, HabitCompletion } from "@/types";

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

export interface DailyCompletionEntry {
  date: string;
  count: number;
}

export interface CategoryBreakdownEntry {
  category: string;
  habitCount: number;
  completionRate: number;
  color: string;
}

export interface LeaderboardEntry {
  habit: Habit;
  completionRate: number;
  currentStreak: number;
  totalCompletions: number;
}

export interface HeatmapCell {
  date: string;
  count: number;
}

export interface AggregateHeatmapData {
  grid: HeatmapCell[][];  // columns (weeks) of 7 rows (days)
  monthLabels: { col: number; label: string }[];
  maxCount: number;
}

// ── Presets ─────────────────────────────────────────────

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: "7D", value: "7d", days: 7 },
  { label: "30D", value: "30d", days: 30 },
  { label: "90D", value: "90d", days: 90 },
  { label: "1Y", value: "1y", days: 365 },
  { label: "All", value: "all", days: 0 },
];

// ── Per-Habit Stats ────────────────────────────────────

export function computeHabitStats(
  habit: Habit,
  completions: HabitCompletion[],
  today: string
): HabitStatsResult {
  const habitCompletions = completions.filter((c) => c.habitId === habit.id);
  const completedDates = new Set(habitCompletions.map((c) => c.date));
  const totalCompletions = habitCompletions.length;

  const createdDate = habit.createdAt.split("T")[0];
  const daysSinceCreation = differenceInCalendarDays(
    parseISO(today),
    parseISO(createdDate)
  );

  // Completion rate: completed scheduled days / total scheduled days
  let scheduledDays = 0;
  let completedScheduledDays = 0;
  for (let i = 0; i <= daysSinceCreation; i++) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!isHabitScheduledForDate(habit, dateStr)) continue;
    scheduledDays++;
    if (completedDates.has(dateStr)) completedScheduledDays++;
  }

  // Current streak: walk backwards from today, skip today if not completed
  let currentStreak = 0;
  let foundMissedDay = false;
  for (let i = 0; i <= daysSinceCreation && !foundMissedDay; i++) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!isHabitScheduledForDate(habit, dateStr)) continue;

    if (completedDates.has(dateStr)) {
      currentStreak++;
    } else if (i === 0) {
      // Today not yet completed — don't break streak
      continue;
    } else {
      foundMissedDay = true;
    }
  }

  // Best streak: walk forward from creation
  let bestStreak = 0;
  let tempStreak = 0;
  for (let i = daysSinceCreation; i >= 0; i--) {
    const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    if (!isHabitScheduledForDate(habit, dateStr)) continue;

    if (completedDates.has(dateStr)) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  const completionRate =
    scheduledDays > 0
      ? Math.round((completedScheduledDays / scheduledDays) * 100)
      : 0;

  return { currentStreak, bestStreak, totalCompletions, completionRate };
}

// ── Overall / Aggregate Stats ──────────────────────────

export function computeOverallStats(
  habits: Habit[],
  completions: HabitCompletion[],
  today: string
): OverallStatsResult {
  const activeHabits = habits.filter((h) => !h.isArchived);
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

// ── Daily Completion Trend ─────────────────────────────

export function buildDailyCompletionTrend(
  completions: HabitCompletion[],
  startDate: string,
  endDate: string
): DailyCompletionEntry[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInCalendarDays(end, start);

  // Count completions per date
  const countMap = new Map<string, number>();
  for (const c of completions) {
    if (c.date >= startDate && c.date <= endDate) {
      countMap.set(c.date, (countMap.get(c.date) ?? 0) + 1);
    }
  }

  // Build one entry per day, zero-filled
  const entries: DailyCompletionEntry[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const dateStr = format(subDays(end, totalDays - i), "yyyy-MM-dd");
    entries.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
  }
  return entries;
}

// ── Aggregate Heatmap (52-week) ────────────────────────

export function buildAggregateHeatmapData(
  completions: HabitCompletion[],
  today: string,
  weekStartsOn: 0 | 1 = 0
): AggregateHeatmapData {
  const WEEKS = 52;
  const todayDate = parseISO(today);
  const weekEnd = startOfWeek(todayDate, { weekStartsOn });
  const gridStart = subWeeks(weekEnd, WEEKS - 1);
  const allDays = eachDayOfInterval({ start: gridStart, end: todayDate });

  // Count completions per date
  const countMap = new Map<string, number>();
  for (const c of completions) {
    countMap.set(c.date, (countMap.get(c.date) ?? 0) + 1);
  }

  // Build columns (one per week, 7 rows each)
  const columns: HeatmapCell[][] = [];
  let currentWeekStart = gridStart;
  let maxCount = 0;

  for (let w = 0; w < WEEKS; w++) {
    const col: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + d);
      const dateStr = format(date, "yyyy-MM-dd");
      const count = dateStr <= today ? (countMap.get(dateStr) ?? 0) : 0;
      maxCount = Math.max(maxCount, count);
      col.push({ date: dateStr, count });
    }
    columns.push(col);
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  // Month labels
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = "";
  for (let w = 0; w < columns.length; w++) {
    const month = columns[w][0].date.slice(0, 7);
    if (month !== lastMonth) {
      monthLabels.push({
        col: w,
        label: format(parseISO(columns[w][0].date), "MMM"),
      });
      lastMonth = month;
    }
  }

  return { grid: columns, monthLabels, maxCount };
}

// ── Category Breakdown ─────────────────────────────────

export function buildCategoryBreakdown(
  habits: Habit[],
  completions: HabitCompletion[],
  today: string
): CategoryBreakdownEntry[] {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const groups = new Map<string, Habit[]>();

  for (const h of activeHabits) {
    const cat = h.category || "Uncategorized";
    const list = groups.get(cat) ?? [];
    list.push(h);
    groups.set(cat, list);
  }

  const entries: CategoryBreakdownEntry[] = [];
  for (const [category, catHabits] of groups) {
    let rateSum = 0;
    for (const h of catHabits) {
      const stats = computeHabitStats(h, completions, today);
      rateSum += stats.completionRate;
    }
    entries.push({
      category,
      habitCount: catHabits.length,
      completionRate:
        catHabits.length > 0 ? Math.round(rateSum / catHabits.length) : 0,
      color: catHabits[0].color,
    });
  }

  return entries.sort((a, b) => b.completionRate - a.completionRate);
}

// ── Leaderboard ────────────────────────────────────────

export function buildLeaderboard(
  habits: Habit[],
  completions: HabitCompletion[],
  today: string
): LeaderboardEntry[] {
  const activeHabits = habits.filter((h) => !h.isArchived);

  return activeHabits
    .map((habit) => {
      const stats = computeHabitStats(habit, completions, today);
      return {
        habit,
        completionRate: stats.completionRate,
        currentStreak: stats.currentStreak,
        totalCompletions: stats.totalCompletions,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate);
}

import {
  parseISO,
  format,
  subDays,
  differenceInCalendarDays,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit, HabitCompletion } from "@/types";
import { computeHabitStats, getActiveHabits } from "./stats-core";

// ── Types ──────────────────────────────────────────────

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

export type HabitHeatmapStatus = "completed" | "scheduled" | "unscheduled" | "future";

export interface HabitHeatmapCell {
  date: string;
  status: HabitHeatmapStatus;
}

export interface HabitHeatmapData {
  grid: HabitHeatmapCell[][]; // columns (weeks) of 7 rows (days)
  monthLabels: { col: number; label: string }[];
}

// ── Constants ──────────────────────────────────────────

const HEATMAP_WEEKS = 52;
const DAYS_PER_WEEK = 7;
const HABIT_HEATMAP_WEEKS = 26;

// ── Daily Completion Trend ─────────────────────────────

export function buildDailyCompletionTrend(
  completions: HabitCompletion[],
  startDate: string,
  endDate: string
): DailyCompletionEntry[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInCalendarDays(end, start);

  const countMap = new Map<string, number>();
  for (const completion of completions) {
    if (completion.date >= startDate && completion.date <= endDate) {
      countMap.set(completion.date, (countMap.get(completion.date) ?? 0) + 1);
    }
  }

  const entries: DailyCompletionEntry[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const dateStr = format(subDays(end, totalDays - i), "yyyy-MM-dd");
    entries.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
  }
  return entries;
}

// ── Heatmap Helpers ────────────────────────────────────

function buildHeatmapGrid(
  gridStart: Date,
  today: string,
  weekCount: number,
  countMap: Map<string, number>
): { columns: HeatmapCell[][]; maxCount: number } {
  const columns: HeatmapCell[][] = [];
  let currentWeekStart = gridStart;
  let maxCount = 0;

  for (let week = 0; week < weekCount; week++) {
    const col: HeatmapCell[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + day);
      const dateStr = format(date, "yyyy-MM-dd");
      const count = dateStr <= today ? (countMap.get(dateStr) ?? 0) : 0;
      maxCount = Math.max(maxCount, count);
      col.push({ date: dateStr, count });
    }
    columns.push(col);
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + DAYS_PER_WEEK);
  }
  return { columns, maxCount };
}

function buildMonthLabels(
  columns: { date: string }[][]
): { col: number; label: string }[] {
  const labels: { col: number; label: string }[] = [];
  let lastMonth = "";
  for (let week = 0; week < columns.length; week++) {
    const month = columns[week][0].date.slice(0, 7);
    if (month !== lastMonth) {
      labels.push({ col: week, label: format(parseISO(columns[week][0].date), "MMM") });
      lastMonth = month;
    }
  }
  return labels;
}

// ── Aggregate Heatmap (52-week) ────────────────────────

export function buildAggregateHeatmapData(
  completions: HabitCompletion[],
  today: string,
  weekStartsOn: 0 | 1 = 0
): AggregateHeatmapData {
  const todayDate = parseISO(today);
  const weekEnd = startOfWeek(todayDate, { weekStartsOn });
  const gridStart = subWeeks(weekEnd, HEATMAP_WEEKS - 1);

  const countMap = new Map<string, number>();
  for (const completion of completions) {
    countMap.set(completion.date, (countMap.get(completion.date) ?? 0) + 1);
  }

  const { columns, maxCount } = buildHeatmapGrid(gridStart, today, HEATMAP_WEEKS, countMap);
  return { grid: columns, monthLabels: buildMonthLabels(columns), maxCount };
}

// ── Category Breakdown ─────────────────────────────────

export function buildCategoryBreakdown(
  habits: Habit[],
  completions: HabitCompletion[],
  today: string
): CategoryBreakdownEntry[] {
  const activeHabits = getActiveHabits(habits);
  const groups = new Map<string, Habit[]>();

  for (const habit of activeHabits) {
    const cat = habit.category || "Uncategorized";
    const list = groups.get(cat) ?? [];
    list.push(habit);
    groups.set(cat, list);
  }

  const entries: CategoryBreakdownEntry[] = [];
  for (const [category, catHabits] of groups) {
    let rateSum = 0;
    for (const habit of catHabits) {
      const stats = computeHabitStats(habit, completions, today);
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
  const activeHabits = getActiveHabits(habits);

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

// ── Per-Habit Heatmap (26-week) ──────────────────────

export function buildHabitHeatmapData(
  habit: Habit,
  completions: HabitCompletion[],
  today: string,
  weekStartsOn: 0 | 1 = 0
): HabitHeatmapData {
  const todayDate = parseISO(today);
  const weekEnd = startOfWeek(todayDate, { weekStartsOn });
  const gridStart = subWeeks(weekEnd, HABIT_HEATMAP_WEEKS - 1);

  const completedDates = new Set(completions.map((c) => c.date));

  const columns: HabitHeatmapCell[][] = [];
  let currentWeekStart = gridStart;

  for (let week = 0; week < HABIT_HEATMAP_WEEKS; week++) {
    const col: HabitHeatmapCell[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + day);
      const dateStr = format(date, "yyyy-MM-dd");

      if (dateStr > today) {
        col.push({ date: dateStr, status: "future" });
      } else if (!isHabitScheduledForDate(habit, dateStr)) {
        col.push({ date: dateStr, status: "unscheduled" });
      } else if (completedDates.has(dateStr)) {
        col.push({ date: dateStr, status: "completed" });
      } else {
        col.push({ date: dateStr, status: "scheduled" });
      }
    }
    columns.push(col);
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + DAYS_PER_WEEK);
  }

  return { grid: columns, monthLabels: buildMonthLabels(columns) };
}

// ── Effort Trend ──────────────────────────────────────

export interface EffortTrendEntry {
  date: string;
  habitId: string;
  habitName: string;
  habitColor: string;
  effort: number;
}

const MIN_EFFORT_RATINGS_FOR_TREND = 5;

/**
 * Builds effort-over-time data for habits with enough effort ratings.
 * Returns entries sorted by date, grouped by habit.
 */
export function buildEffortTrend(
  habits: Habit[],
  completions: HabitCompletion[],
  startDate: string,
  endDate: string
): EffortTrendEntry[] {
  const activeHabits = getActiveHabits(habits);
  const habitMap = new Map(activeHabits.map((h) => [h.id, h]));

  // Group completions with effort ratings by habit
  const effortByHabit = new Map<string, HabitCompletion[]>();
  for (const c of completions) {
    if (c.effort == null || c.date < startDate || c.date > endDate) continue;
    if (!habitMap.has(c.habitId)) continue;
    const list = effortByHabit.get(c.habitId) ?? [];
    list.push(c);
    effortByHabit.set(c.habitId, list);
  }

  const entries: EffortTrendEntry[] = [];
  for (const [habitId, effortCompletions] of effortByHabit) {
    if (effortCompletions.length < MIN_EFFORT_RATINGS_FOR_TREND) continue;
    const habit = habitMap.get(habitId)!;
    for (const c of effortCompletions) {
      entries.push({
        date: c.date,
        habitId,
        habitName: habit.name,
        habitColor: habit.color,
        effort: c.effort!,
      });
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

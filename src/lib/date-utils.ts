import {
  isMonday,
  isTuesday,
  isWednesday,
  isThursday,
  isFriday,
  isSaturday,
  isSunday,
  getDay,
  parseISO,
  startOfWeek,
  addDays,
  format,
  subMonths,
} from "date-fns";
import type { Habit, HabitCompletion } from "@/types";

/**
 * Returns true if the habit is scheduled for the given date string (YYYY-MM-DD).
 */
export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  const date = parseISO(dateStr);
  const dayOfWeek = getDay(date); // 0=Sun, 1=Mon, ..., 6=Sat

  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return !isSaturday(date) && !isSunday(date);
    case "weekends":
      return isSaturday(date) || isSunday(date);
    case "specific_days":
      return habit.targetDays?.includes(dayOfWeek) ?? false;
    case "x_per_week":
      // x_per_week habits are always "available" — completion tracking
      // determines if the weekly target is met
      return true;
    default:
      return false;
  }
}

/**
 * Returns a human-readable label for a habit frequency.
 */
export function frequencyLabel(habit: Habit): string {
  switch (habit.frequency) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekends":
      return "Weekends";
    case "specific_days": {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days = (habit.targetDays ?? [])
        .sort((a, b) => a - b)
        .map((d) => dayNames[d]);
      return days.join(", ");
    }
    case "x_per_week":
      return `${habit.targetCount ?? 0}x per week`;
    default:
      return "";
  }
}

const DAY_CHECKERS = [isSunday, isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday];

export { DAY_CHECKERS };

/**
 * Returns the start-of-week Date for the given date string.
 */
export function getWeekStart(dateStr: string, weekStartsOn: 0 | 1 = 0): Date {
  return startOfWeek(parseISO(dateStr), { weekStartsOn });
}

/**
 * Returns an array of 7 YYYY-MM-DD strings for the week starting at `weekStart`.
 */
export function getWeekDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd")
  );
}

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Aggregates completions by day-of-week.
 * Returns 7 entries: { day: "Sun", count: N } ... { day: "Sat", count: N }.
 */
export function buildWeeklyPatternData(
  completions: HabitCompletion[]
): { day: string; count: number }[] {
  const counts = new Array(7).fill(0) as number[];
  for (const c of completions) {
    const dayIndex = getDay(parseISO(c.date));
    counts[dayIndex]++;
  }
  return DAY_NAMES_SHORT.map((day, i) => ({ day, count: counts[i] }));
}

/**
 * Groups completions by YYYY-MM for the last `monthCount` months (inclusive of current month).
 */
export function buildMonthlyCompletionData(
  completions: HabitCompletion[],
  monthCount: number
): { month: string; count: number }[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    months.push(format(subMonths(now, i), "yyyy-MM"));
  }

  const countMap = new Map<string, number>();
  for (const m of months) countMap.set(m, 0);

  for (const c of completions) {
    const ym = c.date.slice(0, 7); // "YYYY-MM"
    if (countMap.has(ym)) {
      countMap.set(ym, countMap.get(ym)! + 1);
    }
  }

  return months.map((m) => ({
    month: format(parseISO(`${m}-01`), "MMM yyyy"),
    count: countMap.get(m)!,
  }));
}

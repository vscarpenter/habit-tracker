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
} from "date-fns";
import type { Habit } from "@/types";

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

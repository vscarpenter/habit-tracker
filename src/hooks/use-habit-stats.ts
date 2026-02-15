"use client";

import { useCallback, useEffect, useState } from "react";
import { completionService } from "@/db/completion-service";
import { format, subDays, parseISO, differenceInCalendarDays } from "date-fns";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit, HabitCompletion } from "@/types";

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
}

/**
 * Calculates stats for a single habit.
 */
export function useHabitStats(habit: Habit | null, today: string) {
  const [stats, setStats] = useState<HabitStats>({
    currentStreak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    if (!habit) return;

    try {
      const completions = await completionService.getByHabitId(habit.id);
      const completedDates = new Set(completions.map((c) => c.date));

      const totalCompletions = completions.length;

      // Calculate streaks and completion rate
      const createdDate = habit.createdAt.split("T")[0];
      const daysSinceCreation = differenceInCalendarDays(
        parseISO(today),
        parseISO(createdDate)
      );

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      let scheduledDays = 0;
      let completedScheduledDays = 0;

      // Walk backwards from today
      for (let i = 0; i <= daysSinceCreation; i++) {
        const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
        const scheduled = isHabitScheduledForDate(habit, dateStr);

        if (!scheduled) continue;

        scheduledDays++;
        const completed = completedDates.has(dateStr);

        if (completed) {
          completedScheduledDays++;
        }

        // Current streak: count from today backwards
        if (i === 0 || currentStreak > 0 || (i === 0 && !completed)) {
          // For current streak, walk backwards from today
          // handled separately below
        }
      }

      // Calculate current streak separately for clarity
      currentStreak = 0;
      let foundMissedDay = false;
      for (let i = 0; i <= daysSinceCreation && !foundMissedDay; i++) {
        const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
        const scheduled = isHabitScheduledForDate(habit, dateStr);

        if (!scheduled) continue;

        const completed = completedDates.has(dateStr);

        if (completed) {
          currentStreak++;
        } else if (i === 0) {
          // Today not yet completed — don't break streak, just skip
          continue;
        } else {
          foundMissedDay = true;
        }
      }

      // Calculate best streak
      tempStreak = 0;
      bestStreak = 0;
      for (let i = daysSinceCreation; i >= 0; i--) {
        const dateStr = format(subDays(parseISO(today), i), "yyyy-MM-dd");
        const scheduled = isHabitScheduledForDate(habit, dateStr);

        if (!scheduled) continue;

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

      setStats({
        currentStreak,
        bestStreak,
        totalCompletions,
        completionRate,
      });
    } catch (error) {
      console.error("Failed to calculate habit stats:", error);
    } finally {
      setLoading(false);
    }
  }, [habit, today]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { stats, loading, refresh: calculate };
}

/**
 * Aggregate stats across all active habits for the dashboard.
 */
export function useDashboardStats(
  habits: Habit[],
  completions: HabitCompletion[],
  today: string
) {
  const completedToday = new Set(completions.map((c) => c.habitId));
  const scheduledHabits = habits.filter((h) =>
    isHabitScheduledForDate(h, today)
  );
  const completedCount = scheduledHabits.filter((h) =>
    completedToday.has(h.id)
  ).length;

  const todayProgress =
    scheduledHabits.length > 0
      ? Math.round((completedCount / scheduledHabits.length) * 100)
      : 0;

  return {
    scheduledCount: scheduledHabits.length,
    completedCount,
    todayProgress,
    allComplete: scheduledHabits.length > 0 && completedCount === scheduledHabits.length,
  };
}

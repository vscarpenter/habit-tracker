"use client";

import { useCallback, useEffect, useState } from "react";
import { completionService } from "@/db/completion-service";
import { computeHabitStats } from "@/lib/stats-utils";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit, HabitCompletion } from "@/types";
import type { HabitStatsResult } from "@/lib/stats-utils";

// Re-export for backward compatibility
export type HabitStats = HabitStatsResult;

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
      const result = computeHabitStats(habit, completions, today);
      setStats(result);
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

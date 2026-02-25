"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { completionService } from "@/db/completion-service";
import { computeHabitStats } from "@/lib/stats-utils";
import { useToast } from "@/components/shared/toast";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { Habit, HabitCompletion } from "@/types";
const STREAK_LOOKBACK_DAYS = 60;

/**
 * Batch-computes current streak for all given habits with a single DB query.
 * Returns a Map from habitId → currentStreak.
 */
export function useStreaks(habits: Habit[], today: string) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const startDate = useMemo(
    () => format(subDays(parseISO(today), STREAK_LOOKBACK_DAYS), "yyyy-MM-dd"),
    [today]
  );

  const fetchCompletions = useCallback(async () => {
    try {
      const data = await completionService.getByDateRange(startDate, today);
      setCompletions(data);
    } catch (error) {
      logger.error("Failed to load streaks:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }, [startDate, today, toast]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  const streakMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const habit of habits) {
      if (habit.isArchived) continue;
      const stats = computeHabitStats(habit, completions, today);
      map.set(habit.id, stats.currentStreak);
    }
    return map;
  }, [habits, completions, today]);

  return { streakMap, loading };
}

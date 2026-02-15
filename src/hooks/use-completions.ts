"use client";

import { useCallback, useEffect, useState } from "react";
import { completionService } from "@/db/completion-service";
import type { HabitCompletion } from "@/types";

export function useCompletions(date: string) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await completionService.getByDate(date);
      setCompletions(data);
    } catch (error) {
      console.error("Failed to load completions:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (habitId: string) => {
      // Optimistic: check current state
      const isCompleted = completions.some((c) => c.habitId === habitId);

      if (isCompleted) {
        // Optimistic remove
        setCompletions((prev) => prev.filter((c) => c.habitId !== habitId));
      } else {
        // Optimistic add
        const optimistic: HabitCompletion = {
          id: `optimistic-${Date.now()}`,
          habitId,
          date,
          completedAt: new Date().toISOString(),
        };
        setCompletions((prev) => [...prev, optimistic]);
      }

      try {
        await completionService.toggle(habitId, date);
        // Refresh from DB to get the real data
        await refresh();
      } catch (error) {
        console.error("Failed to toggle completion:", error);
        // Rollback on error
        await refresh();
      }
    },
    [completions, date, refresh]
  );

  const isCompleted = useCallback(
    (habitId: string) => completions.some((c) => c.habitId === habitId),
    [completions]
  );

  return { completions, loading, toggle, isCompleted, refresh };
}

/**
 * Hook for loading completions across a date range (used by stats/detail views).
 */
export function useCompletionRange(startDate: string, endDate: string) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await completionService.getByDateRange(startDate, endDate);
      setCompletions(data);
    } catch (error) {
      console.error("Failed to load completions range:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { completions, loading, refresh };
}

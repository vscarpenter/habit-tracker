"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { completionService } from "@/db/completion-service";
import { useToast } from "@/components/shared/toast";
import type { HabitCompletion } from "@/types";

const DB_ERROR_MSG = "Something went wrong. Your data is safe.";

function completionKey(habitId: string, date: string): string {
  return `${habitId}::${date}`;
}

export function useWeekCompletions(startDate: string, endDate: string) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const data = await completionService.getByDateRange(startDate, endDate);
      setCompletions(data);
    } catch (error) {
      console.error("Failed to load week completions:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completionSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of completions) {
      set.add(completionKey(c.habitId, c.date));
    }
    return set;
  }, [completions]);

  const isCompleted = useCallback(
    (habitId: string, date: string) => completionSet.has(completionKey(habitId, date)),
    [completionSet]
  );

  const toggle = useCallback(
    async (habitId: string, date: string) => {
      const key = completionKey(habitId, date);
      const wasCompleted = completionSet.has(key);

      // Optimistic update
      if (wasCompleted) {
        setCompletions((prev) =>
          prev.filter((c) => !(c.habitId === habitId && c.date === date))
        );
      } else {
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
        await refresh();
      } catch (error) {
        console.error("Failed to toggle completion:", error);
        toast(DB_ERROR_MSG, "error");
        await refresh();
      }
    },
    [completionSet, refresh, toast]
  );

  return { completions, loading, isCompleted, toggle, refresh };
}

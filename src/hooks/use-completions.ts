"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { completionService } from "@/db/completion-service";
import { useToast } from "@/components/shared/toast";
import { useSyncRefresh } from "@/contexts/sync-refresh-context";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { HabitCompletion, EffortRating } from "@/types";

interface UseCompletionsReturn {
  completions: HabitCompletion[];
  loading: boolean;
  toggle: (habitId: string) => Promise<void>;
  isCompleted: (habitId: string) => boolean;
  getCompletionId: (habitId: string) => string | undefined;
  updateEffort: (completionId: string, effort: EffortRating | null) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCompletions(date: string): UseCompletionsReturn {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshKey } = useSyncRefresh();

  const refresh = useCallback(async () => {
    try {
      const data = await completionService.getByDate(date);
      setCompletions(data);
    } catch (error) {
      logger.error("Failed to load completions:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }, [date, toast]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

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
        logger.error("Failed to toggle completion:", error);
        toast(DB_ERROR_MSG, "error");
        await refresh();
      }
    },
    [completions, date, refresh, toast]
  );

  const completedHabitIds = useMemo(
    () => new Set(completions.map((c) => c.habitId)),
    [completions]
  );

  const isCompleted = useCallback(
    (habitId: string) => completedHabitIds.has(habitId),
    [completedHabitIds]
  );

  const getCompletionId = useCallback(
    (habitId: string) => completions.find((c) => c.habitId === habitId)?.id,
    [completions]
  );

  const updateEffort = useCallback(
    async (completionId: string, effort: EffortRating | null) => {
      try {
        await completionService.updateEffort(completionId, effort);
        await refresh();
      } catch (error) {
        logger.error("Failed to update effort:", error);
        toast(DB_ERROR_MSG, "error");
      }
    },
    [refresh, toast]
  );

  return { completions, loading, toggle, isCompleted, getCompletionId, updateEffort, refresh };
}

interface UseCompletionRangeReturn {
  completions: HabitCompletion[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for loading completions across a date range (used by stats/detail views).
 */
export function useCompletionRange(startDate: string, endDate: string): UseCompletionRangeReturn {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshKey } = useSyncRefresh();

  const refresh = useCallback(async () => {
    try {
      const data = await completionService.getByDateRange(startDate, endDate);
      setCompletions(data);
    } catch (error) {
      logger.error("Failed to load completions range:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { completions, loading, refresh };
}

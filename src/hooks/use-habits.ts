"use client";

import { useCallback, useEffect, useState } from "react";
import { habitService } from "@/db/habit-service";
import { useToast } from "@/components/shared/toast";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { Habit } from "@/types";
import type { CreateHabitInput, UpdateHabitInput } from "@/db/schemas";

interface UseHabitsReturn {
  habits: Habit[];
  activeHabits: Habit[];
  archivedHabits: Habit[];
  loading: boolean;
  refresh: () => Promise<void>;
  create: (input: CreateHabitInput) => Promise<Habit>;
  update: (id: string, input: UpdateHabitInput) => Promise<Habit>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
}

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const allHabits = await habitService.getAll();
      setHabits(allHabits);
    } catch (error) {
      logger.error("Failed to load habits:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeHabits = habits.filter((h) => !h.isArchived);
  const archivedHabits = habits.filter((h) => h.isArchived);

  const create = useCallback(
    async (input: CreateHabitInput): Promise<Habit> => {
      const habit = await habitService.create(input);
      await refresh();
      return habit;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, input: UpdateHabitInput): Promise<Habit> => {
      const habit = await habitService.update(id, input);
      await refresh();
      return habit;
    },
    [refresh]
  );

  const archive = useCallback(
    async (id: string): Promise<void> => {
      await habitService.archive(id);
      await refresh();
    },
    [refresh]
  );

  const restore = useCallback(
    async (id: string): Promise<void> => {
      await habitService.restore(id);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await habitService.delete(id);
      await refresh();
    },
    [refresh]
  );

  const reorder = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      await habitService.reorder(orderedIds);
      await refresh();
    },
    [refresh]
  );

  return {
    habits,
    activeHabits,
    archivedHabits,
    loading,
    refresh,
    create,
    update,
    archive,
    restore,
    remove,
    reorder,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { habitService } from "@/db/habit-service";
import { useToast } from "@/components/shared/toast";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { Habit } from "@/types";

export function useHabit(id: string | undefined) {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    try {
      const data = await habitService.getById(id);
      if (data) {
        setHabit(data);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      logger.error("Failed to load habit:", error);
      toast(DB_ERROR_MSG, "error");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { habit, loading, notFound, refresh };
}

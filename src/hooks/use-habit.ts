"use client";

import { useCallback, useEffect, useState } from "react";
import { habitService } from "@/db/habit-service";
import type { Habit } from "@/types";

export function useHabit(id: string | undefined) {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      console.error("Failed to load habit:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { habit, loading, notFound, refresh };
}

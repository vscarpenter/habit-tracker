"use client";

import { useCallback, useEffect, useState } from "react";
import { settingsService } from "@/db/settings-service";
import { useToast } from "@/components/shared/toast";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { UserSettings } from "@/types";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const data = await settingsService.get();
      setSettings(data);
    } catch (error) {
      logger.error("Failed to load settings:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (changes: Partial<Omit<UserSettings, "id" | "createdAt" | "updatedAt">>) => {
      try {
        const updated = await settingsService.update(changes);
        setSettings(updated);
        return updated;
      } catch (error) {
        logger.error("Failed to update settings:", error);
        toast(DB_ERROR_MSG, "error");
        return settings;
      }
    },
    [settings, toast]
  );

  return { settings, loading, update, refresh };
}

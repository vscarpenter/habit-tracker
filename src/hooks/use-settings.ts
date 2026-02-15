"use client";

import { useCallback, useEffect, useState } from "react";
import { settingsService } from "@/db/settings-service";
import type { UserSettings } from "@/types";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await settingsService.get();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (changes: Partial<Omit<UserSettings, "id" | "createdAt" | "updatedAt">>) => {
      const updated = await settingsService.update(changes);
      setSettings(updated);
      return updated;
    },
    []
  );

  return { settings, loading, update, refresh };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { chainService } from "@/db/chain-service";
import { useToast } from "@/components/shared/toast";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { HabitChain } from "@/types";

interface UseChainsReturn {
  chains: HabitChain[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useChains(): UseChainsReturn {
  const [chains, setChains] = useState<HabitChain[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const data = await chainService.getAll();
      setChains(data);
    } catch (error) {
      logger.error("Failed to load chains:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { chains, loading, refresh };
}

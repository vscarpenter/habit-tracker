"use client";

import { useMemo, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { DATE_RANGE_PRESETS } from "@/lib/stats-utils";

const DEFAULT_PRESET = "30d";
const ALL_TIME_START = "2000-01-01";

/**
 * Manages date range preset selection for the stats page.
 * Switching presets is instant — no re-fetch needed.
 */
export function useDateRange(today: string) {
  const [selectedPreset, setPreset] = useState(DEFAULT_PRESET);

  const { startDate, endDate } = useMemo(() => {
    const preset = DATE_RANGE_PRESETS.find((p) => p.value === selectedPreset);
    const days = preset?.days ?? 0;

    const start =
      days === 0
        ? ALL_TIME_START
        : format(subDays(parseISO(today), days - 1), "yyyy-MM-dd");

    return { startDate: start, endDate: today };
  }, [selectedPreset, today]);

  return { selectedPreset, setPreset, startDate, endDate };
}

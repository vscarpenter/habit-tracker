"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateRangePreset } from "@/lib/stats-utils";

interface StatsDateRangeProps {
  presets: DateRangePreset[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export function StatsDateRange({
  presets,
  selectedValue,
  onSelect,
}: StatsDateRangeProps) {
  return (
    <div className="hf-panel rounded-2xl p-2">
      <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        Time Range
      </div>
      <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={preset.value === selectedValue ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onSelect(preset.value)}
          className={cn(
            "min-w-[48px]",
            preset.value === selectedValue && "font-semibold"
          )}
        >
          {preset.label}
        </Button>
      ))}
      </div>
    </div>
  );
}

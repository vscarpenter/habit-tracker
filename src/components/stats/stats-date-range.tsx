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
    <div className="flex gap-2 flex-wrap">
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
  );
}

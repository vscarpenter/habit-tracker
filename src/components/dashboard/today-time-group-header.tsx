"use client";

import { Infinity, Moon, Sun, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeOfDay } from "@/types";

const TIME_GROUP_CONFIG: Record<TimeOfDay, { label: string; icon: typeof Sunrise }> = {
  morning: { label: "Morning", icon: Sunrise },
  afternoon: { label: "Afternoon", icon: Sun },
  evening: { label: "Evening", icon: Moon },
  anytime: { label: "Anytime", icon: Infinity },
};

interface TimeGroupHeaderProps {
  timeOfDay: TimeOfDay;
  completed: number;
  total: number;
  isFirst: boolean;
}

export function TimeGroupHeader({
  timeOfDay,
  completed,
  total,
  isFirst,
}: TimeGroupHeaderProps) {
  const config = TIME_GROUP_CONFIG[timeOfDay];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-surface-muted/40 px-5 py-2.5",
        !isFirst && "border-t border-border-subtle/70"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          {config.label}
        </span>
      </div>
      <span className="text-xs font-medium text-text-muted">
        {completed}/{total}
      </span>
    </div>
  );
}

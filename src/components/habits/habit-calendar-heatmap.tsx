"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buildHabitHeatmapData } from "@/lib/stats-utils";
import type { Habit, HabitCompletion } from "@/types";

interface HabitCalendarHeatmapProps {
  habit: Habit;
  completions: HabitCompletion[];
  today: string;
  weekStartsOn?: 0 | 1;
}

const WEEKS = 26;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function HabitCalendarHeatmap({
  habit,
  completions,
  today,
  weekStartsOn = 0,
}: HabitCalendarHeatmapProps) {
  const { grid, monthLabels } = useMemo(
    () => buildHabitHeatmapData(habit, completions, today, weekStartsOn),
    [habit, completions, today, weekStartsOn]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Last 26 weeks of scheduled vs completed activity</CardDescription>
      </CardHeader>

      <div className="overflow-x-auto rounded-2xl border border-border-subtle/70 bg-surface-overlay/45 p-3">
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {monthLabels.map(({ col, label }, i) => {
            const nextCol = monthLabels[i + 1]?.col ?? WEEKS;
            const span = nextCol - col;
            return (
              <div
                key={`${label}-${col}`}
                className="text-[10px] text-text-muted"
                style={{ width: `${span * 14}px`, minWidth: `${span * 14}px` }}
              >
                {label}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="h-[10px] w-6 text-[9px] text-text-muted leading-[10px] text-right pr-1"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {grid.map((col, w) => (
              <div key={w} className="flex flex-col gap-[2px]">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    className={cn(
                      "h-[10px] w-[10px] rounded-[3px]",
                      cell.status === "future" && "bg-transparent",
                      cell.status === "unscheduled" && "bg-border-subtle/30",
                      cell.status === "scheduled" && "bg-border-subtle",
                    )}
                    style={
                      cell.status === "completed"
                        ? { backgroundColor: habit.color }
                        : undefined
                    }
                    title={`${cell.date}: ${cell.status}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-3 text-[10px] text-text-muted">
          <div className="flex items-center gap-1">
            <div className="h-[10px] w-[10px] rounded-[2px] bg-border-subtle/30" />
            <span>Not scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-[10px] w-[10px] rounded-[2px] bg-border-subtle" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{ backgroundColor: habit.color }}
            />
            <span>Completed</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { AggregateHeatmapData } from "@/lib/stats-utils";

interface AggregateHeatmapProps {
  data: AggregateHeatmapData;
  today: string;
}

const WEEKS = 52;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function intensityColor(count: number, maxCount: number): string {
  if (count === 0) return "var(--border-subtle)";
  if (maxCount === 0) return "var(--border-subtle)";

  const ratio = count / maxCount;
  if (ratio <= 0.25) return "#93c5fd"; // blue-300
  if (ratio <= 0.5) return "#60a5fa";  // blue-400
  if (ratio <= 0.75) return "#3b82f6"; // blue-500
  return "#2563eb";                     // blue-600
}

export function AggregateHeatmap({ data, today }: AggregateHeatmapProps) {
  const { grid, monthLabels, maxCount } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>

      <div className="overflow-x-auto">
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
                    className="h-[10px] w-[10px] rounded-[2px]"
                    style={{
                      backgroundColor:
                        cell.date > today
                          ? "transparent"
                          : intensityColor(cell.count, maxCount),
                      opacity: cell.date > today ? 0 : cell.count === 0 ? 0.3 : 1,
                    }}
                    title={`${cell.date}: ${cell.count} completion${cell.count !== 1 ? "s" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-text-muted">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <div
              key={i}
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{
                backgroundColor: intensityColor(
                  ratio * Math.max(maxCount, 1),
                  Math.max(maxCount, 1)
                ),
                opacity: ratio === 0 ? 0.3 : 1,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}

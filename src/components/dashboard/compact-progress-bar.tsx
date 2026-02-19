"use client";

import { DailyProgressRing } from "./daily-progress-ring";

interface CompactProgressBarProps {
  completed: number;
  total: number;
}

export function CompactProgressBar({ completed, total }: CompactProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <DailyProgressRing completed={completed} total={total} className="scale-[0.3] -m-12" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-text-primary">
            {completed} of {total} complete
          </span>
          <span className="text-xs font-semibold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">
            {percentage}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-border-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-blue transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

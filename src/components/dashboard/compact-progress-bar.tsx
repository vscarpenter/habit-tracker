"use client";

import { DailyProgressRing } from "./daily-progress-ring";

interface CompactProgressBarProps {
  completed: number;
  total: number;
}

export function CompactProgressBar({ completed, total }: CompactProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = Math.max(total - completed, 0);

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <div className="rounded-2xl border border-border-subtle bg-surface-muted/70 p-1">
        <DailyProgressRing
          completed={completed}
          total={total}
          className="scale-[0.34] -m-11"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            {completed} of {total} complete
          </span>
          <span className="rounded-full bg-accent-blue/12 px-2 py-0.5 text-xs font-semibold text-accent-blue">
            {percentage}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent-blue transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {remaining === 0
            ? "Everything scheduled for today is done."
            : `${remaining} habit${remaining !== 1 ? "s" : ""} left for today.`}
        </p>
      </div>
    </div>
  );
}

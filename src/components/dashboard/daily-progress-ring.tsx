"use client";

import { cn } from "@/lib/utils";

interface DailyProgressRingProps {
  completed: number;
  total: number;
  className?: string;
}

export function DailyProgressRing({
  completed,
  total,
  className,
}: DailyProgressRingProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-text-primary">
          {completed}
        </span>
        <span className="text-xs text-text-muted">
          of {total}
        </span>
      </div>
    </div>
  );
}

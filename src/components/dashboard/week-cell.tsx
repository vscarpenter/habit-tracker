"use client";

import { cn } from "@/lib/utils";
import { CompletionToggle } from "@/components/habits/completion-toggle";
import { Minus } from "lucide-react";

interface WeekCellProps {
  scheduled: boolean;
  completed: boolean;
  color: string;
  isToday: boolean;
  isFuture: boolean;
  onToggle: () => void;
}

export function WeekCell({
  scheduled,
  completed,
  color,
  isToday,
  isFuture,
  onToggle,
}: WeekCellProps) {
  const wrapperClass = cn(
    "flex min-h-[52px] items-center justify-center rounded-xl border transition-colors duration-150",
    isToday
      ? "border-accent-blue/35 bg-accent-blue/8"
      : "border-transparent"
  );

  if (isFuture) {
    return (
      <div
        className={cn(wrapperClass, "bg-surface-muted/35")}
      >
        {scheduled ? (
          <div
            className="h-4 w-4 rounded-full border-2"
            style={{ borderColor: `${color}88` }}
          />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-text-muted/35" />
        )}
      </div>
    );
  }

  if (!scheduled) {
    return (
      <div className={cn(wrapperClass, "bg-surface-muted/25")}>
        <Minus className="h-4 w-4 text-text-muted/45" />
      </div>
    );
  }

  return (
    <div
      className={cn(wrapperClass, "bg-surface/45")}
      style={{
        backgroundColor: completed ? `${color}1c` : undefined,
      }}
    >
      <CompletionToggle
        completed={completed}
        color={color}
        onToggle={onToggle}
        size="sm"
      />
    </div>
  );
}

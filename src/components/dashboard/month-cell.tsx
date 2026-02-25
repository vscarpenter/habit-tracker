"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { COMPLETION_ANIMATION_MS } from "@/lib/constants";

interface MonthCellProps {
  scheduled: boolean;
  completed: boolean;
  color: string;
  isFuture: boolean;
  isToday: boolean;
  onToggle: () => void;
}

export function MonthCell({
  scheduled,
  completed,
  color,
  isFuture,
  isToday,
  onToggle,
}: MonthCellProps) {
  const [animating, setAnimating] = useState(false);

  if (isFuture) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-md">
        {scheduled ? (
          <div
            className="h-3.5 w-3.5 rounded-full border-[1.5px]"
            style={{ borderColor: `${color}88` }}
          />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-text-muted/30" />
        )}
      </div>
    );
  }

  if (!scheduled) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-overlay/28">
        <div className="h-1.5 w-1.5 rounded-full bg-text-muted/30" />
      </div>
    );
  }

  const handleClick = () => {
    if (!completed) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), COMPLETION_ANIMATION_MS);
    }
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center border",
        "transition-all duration-150",
        completed ? "shadow-[var(--shadow-editorial-sm)]" : "border-border-subtle/60 bg-surface-paper/40 hover:border-border-subtle",
        isToday && "ring-1 ring-accent-blue/45 ring-offset-1 ring-offset-background",
        animating && "animate-cell-fill"
      )}
      style={{
        backgroundColor: completed ? color : "transparent",
        borderColor: completed ? `${color}88` : undefined,
      }}
      aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
      aria-pressed={completed}
    />
  );
}

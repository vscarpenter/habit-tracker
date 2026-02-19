"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface MonthCellProps {
  scheduled: boolean;
  completed: boolean;
  color: string;
  onToggle: () => void;
}

export function MonthCell({ scheduled, completed, color, onToggle }: MonthCellProps) {
  const [animating, setAnimating] = useState(false);

  if (!scheduled) {
    return (
      <div className="flex items-center justify-center h-7 w-7">
        <div className="h-1.5 w-1.5 rounded-full bg-text-muted/20" />
      </div>
    );
  }

  const handleClick = () => {
    if (!completed) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 200);
    }
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center",
        "transition-all duration-150",
        completed ? "shadow-sm" : "border border-border-subtle/60 hover:border-border-subtle",
        animating && "animate-cell-fill"
      )}
      style={{
        backgroundColor: completed ? color : "transparent",
      }}
      aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
      aria-pressed={completed}
    />
  );
}

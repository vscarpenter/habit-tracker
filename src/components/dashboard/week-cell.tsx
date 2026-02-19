"use client";

import { cn } from "@/lib/utils";
import { CompletionToggle } from "@/components/habits/completion-toggle";
import { Minus } from "lucide-react";

interface WeekCellProps {
  scheduled: boolean;
  completed: boolean;
  color: string;
  isToday: boolean;
  onToggle: () => void;
}

export function WeekCell({ scheduled, completed, color, isToday, onToggle }: WeekCellProps) {
  if (!scheduled) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[44px] rounded-lg",
          isToday && "bg-accent-blue/5"
        )}
      >
        <Minus className="h-4 w-4 text-text-muted/40" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[44px] rounded-lg transition-colors duration-150",
        isToday && "bg-accent-blue/5"
      )}
      style={{
        backgroundColor: completed && !isToday ? `${color}15` : undefined,
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

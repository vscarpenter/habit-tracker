"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CompletionToggle } from "./completion-toggle";
import { frequencyLabel } from "@/lib/date-utils";
import type { Habit } from "@/types";

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
}

export function HabitCard({ habit, completed, onToggle }: HabitCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-surface backdrop-blur-xl border border-border",
        "transition-all duration-200",
        completed && "opacity-75"
      )}
    >
      <CompletionToggle
        completed={completed}
        color={habit.color}
        onToggle={onToggle}
      />

      <Link href={`/habits/${habit.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{habit.icon}</span>
          <span
            className={cn(
              "font-medium text-sm truncate",
              completed
                ? "text-text-muted line-through"
                : "text-text-primary"
            )}
          >
            {habit.name}
          </span>
        </div>
        <div className="text-xs text-text-muted mt-0.5 ml-7">
          {frequencyLabel(habit)}
        </div>
      </Link>
    </div>
  );
}

"use client";

import { CompletionToggle } from "@/components/habits/completion-toggle";
import { Minus } from "lucide-react";

interface WeekCellProps {
  scheduled: boolean;
  completed: boolean;
  color: string;
  onToggle: () => void;
}

export function WeekCell({ scheduled, completed, color, onToggle }: WeekCellProps) {
  if (!scheduled) {
    return (
      <div className="flex items-center justify-center min-h-[44px]">
        <Minus className="h-4 w-4 text-text-muted/40" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[44px]">
      <CompletionToggle
        completed={completed}
        color={color}
        onToggle={onToggle}
        size="sm"
      />
    </div>
  );
}

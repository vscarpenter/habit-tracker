"use client";

import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { frequencyLabel } from "@/lib/date-utils";
import type { Habit } from "@/types";

interface HabitDetailHeaderProps {
  habit: Habit;
}

export function HabitDetailHeader({ habit }: HabitDetailHeaderProps) {
  return (
    <div>
      {/* Back link */}
      <Link
        href="/habits"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Color accent bar */}
      <div
        className="h-1.5 rounded-full w-16 mb-4"
        style={{ backgroundColor: habit.color }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-3xl shrink-0">{habit.icon}</span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-text-primary truncate">
              {habit.name}
            </h2>
            {habit.description && (
              <p className="text-sm text-text-secondary mt-1">
                {habit.description}
              </p>
            )}
            <Badge className="mt-2">{frequencyLabel(habit)}</Badge>
          </div>
        </div>

        <Link href={`/habits/${habit.id}/edit`}>
          <Button variant="secondary" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </Link>
      </div>
    </div>
  );
}

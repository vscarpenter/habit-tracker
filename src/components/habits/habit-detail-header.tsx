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
    <div className="hf-hero rounded-3xl p-5">
      {/* Back link */}
      <Link
        href="/habits"
        className="relative z-[1] mb-4 inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-sm text-text-secondary transition-colors hover:border-border-subtle hover:bg-surface-paper/70 hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Color accent bar */}
      <div
        className="relative z-[1] mb-4 h-1.5 w-16 rounded-full"
        style={{ backgroundColor: habit.color }}
      />

      <div className="relative z-[1] flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-surface-paper text-3xl shadow-[var(--shadow-editorial-sm)]">
            {habit.icon}
          </span>
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

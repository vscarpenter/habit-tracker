"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { CompactProgressBar } from "./compact-progress-bar";
import { CompletionToggle } from "@/components/habits/completion-toggle";
import { NoHabitsEmpty, AllCompleteMessage } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import { useDashboardStats } from "@/hooks/use-habit-stats";
import type { Habit, HabitCompletion } from "@/types";

interface TodayViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  today: string;
  loading: boolean;
  onToggle: (habitId: string) => void;
  isCompleted: (habitId: string) => boolean;
  showStreaks?: boolean;
  streakMap?: Map<string, number>;
}

export function TodayView({
  habits,
  completions,
  today,
  loading,
  onToggle,
  isCompleted,
  showStreaks = false,
  streakMap,
}: TodayViewProps) {
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.isArchived),
    [habits]
  );

  const scheduledHabits = useMemo(
    () =>
      activeHabits
        .filter((h) => isHabitScheduledForDate(h, today))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [activeHabits, today]
  );

  const { scheduledCount, completedCount, allComplete } =
    useDashboardStats(activeHabits, completions, today);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return <NoHabitsEmpty />;
  }

  return (
    <div className="space-y-4">
      {/* Compact Progress */}
      <div className="rounded-2xl bg-surface-elevated backdrop-blur-xl border border-border p-4">
        <CompactProgressBar completed={completedCount} total={scheduledCount} />
      </div>

      {/* Checklist */}
      {scheduledHabits.length > 0 ? (
        <div className="rounded-2xl bg-surface-elevated backdrop-blur-xl border border-border overflow-hidden">
          {scheduledHabits.map((habit, idx) => {
            const completed = isCompleted(habit.id);
            const streak = streakMap?.get(habit.id) ?? 0;
            const isLast = idx === scheduledHabits.length - 1;

            return (
              <ChecklistRow
                key={habit.id}
                habit={habit}
                completed={completed}
                streak={showStreaks ? streak : 0}
                onToggle={() => onToggle(habit.id)}
                isLast={isLast}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-text-muted py-8">
          No habits scheduled for today.
        </p>
      )}

      {/* All Complete Message */}
      {allComplete && <AllCompleteMessage />}
    </div>
  );
}

interface ChecklistRowProps {
  habit: Habit;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  isLast: boolean;
}

const MIN_STREAK_DISPLAY = 2;

function ChecklistRow({ habit, completed, streak, onToggle, isLast }: ChecklistRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        "hover:bg-surface/50 transition-colors duration-150",
        !isLast && "border-b border-border-subtle/50"
      )}
    >
      <CompletionToggle
        completed={completed}
        color={habit.color}
        onToggle={onToggle}
        size="sm"
      />

      <Link
        href={`/habits/${habit.id}`}
        className="flex-1 min-w-0 flex items-center gap-2"
      >
        <span className="text-base shrink-0">{habit.icon}</span>
        <span
          className={cn(
            "text-sm font-medium truncate transition-all duration-200",
            completed
              ? "text-text-muted line-through"
              : "text-text-primary"
          )}
        >
          {habit.name}
        </span>
      </Link>

      {streak >= MIN_STREAK_DISPLAY && (
        <div className="flex items-center gap-0.5 text-xs font-medium text-accent-amber shrink-0">
          <Flame className="h-3.5 w-3.5" />
          <span>{streak}</span>
        </div>
      )}
    </div>
  );
}

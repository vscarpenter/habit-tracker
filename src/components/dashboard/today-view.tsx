"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, Flame } from "lucide-react";
import { CompactProgressBar } from "./compact-progress-bar";
import { CompletionToggle } from "@/components/habits/completion-toggle";
import { NoHabitsEmpty, AllCompleteMessage } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  const remainingCount = Math.max(scheduledCount - completedCount, 0);
  const completionRate = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

  const focusCategories = useMemo(() => {
    const categories = scheduledHabits
      .map((habit) => habit.category)
      .filter((category): category is string => Boolean(category));
    return Array.from(new Set(categories)).slice(0, 3);
  }, [scheduledHabits]);

  const streakingCount = useMemo(
    () =>
      scheduledHabits.filter(
        (habit) => (streakMap?.get(habit.id) ?? 0) >= MIN_STREAK_DISPLAY
      ).length,
    [scheduledHabits, streakMap]
  );

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
    <div className="space-y-5">
      <div className="rounded-3xl border border-border-subtle bg-surface-strong/90 p-4 shadow-sm backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Today&apos;s Momentum
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary sm:text-2xl">
              {completedCount} of {scheduledCount} habits complete
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {remainingCount === 0
                ? "All scheduled habits are done. Keep this rhythm going."
                : `${remainingCount} left today. Small steps compound quickly.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent" className="px-3 py-1 text-[11px]">
              {completionRate}% completion
            </Badge>
            {showStreaks && streakingCount > 0 && (
              <Badge className="px-3 py-1 text-[11px]">
                {streakingCount} streaking
              </Badge>
            )}
          </div>
        </div>

        <CompactProgressBar completed={completedCount} total={scheduledCount} />

        {focusCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">Focus areas:</span>
            {focusCategories.map((category) => (
              <Badge key={category} className="text-[11px]">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Checklist */}
      {scheduledHabits.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated/90 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border-subtle/70 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Checklist</h3>
              <p className="text-xs text-text-muted">
                {scheduledHabits.length} scheduled habit{scheduledHabits.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              href="/habits"
              className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Manage
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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
        "group relative flex items-center gap-3 px-4 py-3.5",
        "transition-colors duration-150 hover:bg-surface/55",
        !isLast && "border-b border-border-subtle/50"
      )}
    >
      <span
        aria-hidden
        className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full opacity-80"
        style={{ backgroundColor: habit.color, opacity: completed ? 0.35 : 0.8 }}
      />
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
        {habit.category && (
          <Badge className="hidden md:inline-flex text-[11px]">
            {habit.category}
          </Badge>
        )}
      </Link>

      {streak >= MIN_STREAK_DISPLAY && (
        <div className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-accent-amber shrink-0">
          <Flame className="h-3.5 w-3.5" />
          <span>{streak}</span>
        </div>
      )}
    </div>
  );
}

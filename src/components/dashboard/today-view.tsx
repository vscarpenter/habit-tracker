"use client";

import { useMemo } from "react";
import { DailyProgressRing } from "./daily-progress-ring";
import { QuickStatsGrid } from "./quick-stats-grid";
import { HabitCard } from "@/components/habits/habit-card";
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
}

export function TodayView({
  habits,
  completions,
  today,
  loading,
  onToggle,
  isCompleted,
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

  const { scheduledCount, completedCount, todayProgress, allComplete } =
    useDashboardStats(activeHabits, completions, today);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-36 w-36 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return <NoHabitsEmpty />;
  }

  return (
    <div className="space-y-6">
      {/* Progress Ring */}
      <div className="flex justify-center">
        <DailyProgressRing
          completed={completedCount}
          total={scheduledCount}
        />
      </div>

      {/* Quick Stats */}
      <QuickStatsGrid
        todayProgress={todayProgress}
        completedCount={completedCount}
        scheduledCount={scheduledCount}
      />

      {/* Habit List */}
      {scheduledHabits.length > 0 ? (
        <div className="space-y-2">
          {scheduledHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={isCompleted(habit.id)}
              onToggle={() => onToggle(habit.id)}
            />
          ))}
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

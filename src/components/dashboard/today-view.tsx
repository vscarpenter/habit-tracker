"use client";

import { useMemo } from "react";
import { NoHabitsEmpty } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MotionPage,
} from "@/components/shared/motion";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import { useDashboardStats } from "@/hooks/use-habit-stats";
import type { Habit, HabitCompletion, HabitChain, EffortRating } from "@/types";
import { TodayOverview } from "./today-overview";
import { TodayChecklist } from "./today-checklist";

const MIN_STREAK_DISPLAY = 2;

interface TodayViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  chains?: HabitChain[];
  today: string;
  loading: boolean;
  onToggle: (habitId: string) => void;
  onEffort?: (completionId: string, effort: EffortRating | null) => void;
  onValueChange?: (habitId: string, value: number) => void;
  isCompleted: (habitId: string) => boolean;
  getCompletionId?: (habitId: string) => string | undefined;
  getCompletionValue?: (habitId: string) => number;
  showStreaks?: boolean;
  showCompletionRate?: boolean;
  streakMap?: Map<string, number>;
}

export function TodayView({
  habits,
  completions,
  chains = [],
  today,
  loading,
  onToggle,
  onEffort,
  onValueChange,
  isCompleted,
  getCompletionId,
  getCompletionValue,
  showStreaks = false,
  showCompletionRate = true,
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
    <MotionPage className="space-y-5">
      <TodayOverview
        scheduledCount={scheduledCount}
        completedCount={completedCount}
        remainingCount={remainingCount}
        completionRate={completionRate}
        focusCategories={focusCategories}
        streakingCount={streakingCount}
        showStreaks={showStreaks}
        showCompletionRate={showCompletionRate}
      />

      <TodayChecklist
        scheduledHabits={scheduledHabits}
        chains={chains}
        allComplete={allComplete}
        showStreaks={showStreaks}
        streakMap={streakMap}
        onToggle={onToggle}
        onEffort={onEffort}
        onValueChange={onValueChange}
        isCompleted={isCompleted}
        getCompletionId={getCompletionId}
        getCompletionValue={getCompletionValue}
      />
    </MotionPage>
  );
}

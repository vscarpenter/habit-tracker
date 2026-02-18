"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { format, parseISO, subMonths } from "date-fns";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { HabitDetailHeader } from "@/components/habits/habit-detail-header";
import { HabitStatsGrid } from "@/components/habits/habit-stats-grid";
import { HabitCalendarHeatmap } from "@/components/habits/habit-calendar-heatmap";
import { HabitMonthlyChart } from "@/components/habits/habit-monthly-chart";
import { HabitWeeklyPattern } from "@/components/habits/habit-weekly-pattern";
import { HabitRecentHistory } from "@/components/habits/habit-recent-history";
import { useHabit } from "@/hooks/use-habit";
import { useHabitStats } from "@/hooks/use-habit-stats";
import { useCompletionRange } from "@/hooks/use-completions";
import { useToday } from "@/hooks/use-today";
import { useSettings } from "@/hooks/use-settings";
import { CalendarDays } from "lucide-react";

export default function HabitDetailPage() {
  const params = useParams<{ id: string }>();
  const today = useToday();
  const { settings } = useSettings();

  const { habit, loading: habitLoading, notFound } = useHabit(params.id);
  const { stats, loading: statsLoading } = useHabitStats(habit, today);

  const sixMonthsAgo = useMemo(
    () => format(subMonths(parseISO(today), 6), "yyyy-MM-dd"),
    [today]
  );
  const { completions, loading: completionsLoading } = useCompletionRange(
    sixMonthsAgo,
    today
  );

  // Filter completions to this habit only
  const habitCompletions = useMemo(
    () => completions.filter((c) => c.habitId === habit?.id),
    [completions, habit?.id]
  );

  if (habitLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-1.5 w-16 rounded-full" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (notFound || !habit) {
    return (
      <PageContainer>
        <EmptyState
          icon={CalendarDays}
          title="Habit not found"
          description="This habit doesn't exist or may have been deleted."
          actionLabel="Go to Habits"
          actionHref="/habits"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <HabitDetailHeader habit={habit} />

        <HabitStatsGrid
          stats={stats}
          color={habit.color}
          loading={statsLoading}
        />

        <HabitCalendarHeatmap
          habit={habit}
          completions={habitCompletions}
          today={today}
          weekStartsOn={settings?.weekStartsOn}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <HabitMonthlyChart
            completions={habitCompletions}
            color={habit.color}
          />
          <HabitWeeklyPattern
            completions={habitCompletions}
            color={habit.color}
          />
        </div>

        <HabitRecentHistory
          habit={habit}
          completions={completions}
          today={today}
        />
      </div>
    </PageContainer>
  );
}

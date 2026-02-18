"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full rounded-2xl" />;
}

export const LazyCompletionTrendChart = dynamic(
  () =>
    import("@/components/stats/completion-trend-chart").then(
      (mod) => mod.CompletionTrendChart
    ),
  { ssr: false, loading: ChartSkeleton }
);

export const LazyCategoryBreakdown = dynamic(
  () =>
    import("@/components/stats/category-breakdown").then(
      (mod) => mod.CategoryBreakdown
    ),
  { ssr: false, loading: ChartSkeleton }
);

export const LazyWeeklyPatternChart = dynamic(
  () =>
    import("@/components/stats/weekly-pattern-chart").then(
      (mod) => mod.WeeklyPatternChart
    ),
  { ssr: false, loading: ChartSkeleton }
);

export const LazyHabitMonthlyChart = dynamic(
  () =>
    import("@/components/habits/habit-monthly-chart").then(
      (mod) => mod.HabitMonthlyChart
    ),
  { ssr: false, loading: ChartSkeleton }
);

export const LazyHabitWeeklyPattern = dynamic(
  () =>
    import("@/components/habits/habit-weekly-pattern").then(
      (mod) => mod.HabitWeeklyPattern
    ),
  { ssr: false, loading: ChartSkeleton }
);

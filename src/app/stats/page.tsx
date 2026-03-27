"use client";

import { useCallback, useMemo, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { useToday } from "@/hooks/use-today";
import { useHabits } from "@/hooks/use-habits";
import { useSettings } from "@/hooks/use-settings";
import { useCompletionRange } from "@/hooks/use-completions";
import { useDateRange } from "@/hooks/use-date-range";
import { NoStatsEmpty } from "@/components/shared/empty-state";
import { StatsSkeleton } from "@/components/stats/stats-skeleton";
import { StatsDateRange } from "@/components/stats/stats-date-range";
import { OverallStatsRow } from "@/components/stats/overall-stats-row";
import {
  LazyCompletionTrendChart as CompletionTrendChart,
  LazyCategoryBreakdown as CategoryBreakdown,
  LazyWeeklyPatternChart as WeeklyPatternChart,
  LazyEffortTrendChart as EffortTrendChart,
} from "@/components/charts/lazy-charts";
import { AggregateHeatmap } from "@/components/stats/aggregate-heatmap";
import { HabitLeaderboard } from "@/components/stats/habit-leaderboard";
import {
  DATE_RANGE_PRESETS,
  computeOverallStats,
  buildDailyCompletionTrend,
  buildAggregateHeatmapData,
  buildCategoryBreakdown,
  buildLeaderboard,
  buildEffortTrend,
} from "@/lib/stats-utils";
import { buildWeeklyPatternData } from "@/lib/date-utils";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { ProgressCardDialog } from "@/components/shared/progress-card-dialog";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StatsPage() {
  const today = useToday();
  const { activeHabits, loading: habitsLoading } = useHabits();
  const { settings } = useSettings();
  const { selectedPreset, setPreset, startDate, endDate } = useDateRange(today);

  // Fetch 1 year of completions — filter in-memory for selected range
  const yearAgo = useMemo(
    () => format(subDays(parseISO(today), 365), "yyyy-MM-dd"),
    [today]
  );
  const { completions: allCompletions, loading: completionsLoading } =
    useCompletionRange(yearAgo, today);

  const loading = habitsLoading || completionsLoading;
  const weekStartsOn = settings?.weekStartsOn ?? 0;

  // Filter completions to selected date range (for trend/stats, not heatmap)
  const rangeCompletions = useMemo(
    () => allCompletions.filter((c) => c.date >= startDate && c.date <= endDate),
    [allCompletions, startDate, endDate]
  );

  // Computed data — all memoized
  const overallStats = useMemo(
    () => computeOverallStats(activeHabits, rangeCompletions, today),
    [activeHabits, rangeCompletions, today]
  );

  const trendData = useMemo(
    () => buildDailyCompletionTrend(rangeCompletions, startDate, endDate),
    [rangeCompletions, startDate, endDate]
  );

  const heatmapData = useMemo(
    () => buildAggregateHeatmapData(allCompletions, today, weekStartsOn),
    [allCompletions, today, weekStartsOn]
  );

  const categoryData = useMemo(
    () => buildCategoryBreakdown(activeHabits, rangeCompletions, today),
    [activeHabits, rangeCompletions, today]
  );

  const leaderboardData = useMemo(
    () => buildLeaderboard(activeHabits, rangeCompletions, today),
    [activeHabits, rangeCompletions, today]
  );

  const weeklyPatternData = useMemo(
    () => buildWeeklyPatternData(rangeCompletions),
    [rangeCompletions]
  );

  const effortTrendData = useMemo(
    () => buildEffortTrend(activeHabits, rangeCompletions, startDate, endDate),
    [activeHabits, rangeCompletions, startDate, endDate]
  );

  // Flat heatmap data for share card
  const flatHeatmapData = useMemo(
    () => heatmapData.grid.flatMap((week) => week.map((cell) => ({ date: cell.date, count: cell.count }))),
    [heatmapData]
  );

  const [shareOpen, setShareOpen] = useState(false);

  const renderShareCard = useCallback(
    (canvas: HTMLCanvasElement) => {
      import("@/lib/progress-card-renderer").then(({ renderOverallCard }) => {
        renderOverallCard(canvas, overallStats, flatHeatmapData);
      });
    },
    [overallStats, flatHeatmapData]
  );

  return (
    <ErrorBoundary>
    <PageContainer>
      <div className="flex items-start justify-between gap-4">
        <Header
          title="Statistics"
          subtitle="Track your progress over time"
          eyebrow="Analytics"
          accentColor="var(--accent-violet)"
        />
        {!loading && activeHabits.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)} className="shrink-0 mt-2">
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Generate Card
          </Button>
        )}
      </div>

      {loading ? (
        <StatsSkeleton />
      ) : activeHabits.length === 0 ? (
        <NoStatsEmpty />
      ) : (
        <div className="space-y-6">
          <StatsDateRange
            presets={DATE_RANGE_PRESETS}
            selectedValue={selectedPreset}
            onSelect={setPreset}
          />

          <OverallStatsRow stats={overallStats} loading={false} />

          <CompletionTrendChart data={trendData} />

          <AggregateHeatmap data={heatmapData} today={today} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CategoryBreakdown data={categoryData} />
            <WeeklyPatternChart data={weeklyPatternData} />
          </div>

          {effortTrendData.length > 0 && (
            <EffortTrendChart data={effortTrendData} />
          )}

          <HabitLeaderboard entries={leaderboardData} loading={false} />
        </div>
      )}
      <ProgressCardDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="Share Stats Card"
        filename={`habitflow-stats-${today}.png`}
        renderCard={renderShareCard}
      />
    </PageContainer>
    </ErrorBoundary>
  );
}

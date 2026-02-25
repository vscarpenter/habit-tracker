"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, Flame, Hash } from "lucide-react";
import type { OverallStatsResult } from "@/lib/stats-utils";

interface OverallStatsRowProps {
  stats: OverallStatsResult;
  loading: boolean;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  accent: string;
}

function StatCard({ icon: Icon, label, value, accent }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden py-4">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent, opacity: 0.7 }}
      />
      <div className="flex items-start gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle"
        style={{ backgroundColor: "var(--surface-tint)" }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</div>
        <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
      </div>
      </div>
    </Card>
  );
}

export function OverallStatsRow({ stats, loading }: OverallStatsRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        icon={Activity}
        label="Active Habits"
        value={stats.totalActiveHabits}
        accent="var(--chart-1)"
      />
      <StatCard
        icon={TrendingUp}
        label="Completion Rate"
        value={`${stats.overallCompletionRate}%`}
        accent="var(--chart-2)"
      />
      <StatCard
        icon={Flame}
        label="Best Streak"
        value={stats.bestCurrentStreak}
        accent="var(--chart-4)"
      />
      <StatCard
        icon={Hash}
        label="Total Completions"
        value={stats.totalCompletions}
        accent="var(--chart-3)"
      />
    </div>
  );
}

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
    <Card className="flex flex-col items-center text-center py-4">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center mb-2 border border-border-subtle"
        style={{ backgroundColor: "var(--surface-muted)" }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="text-xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
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

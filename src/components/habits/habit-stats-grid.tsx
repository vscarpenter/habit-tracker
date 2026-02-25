"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Trophy, Hash, TrendingUp } from "lucide-react";
import type { HabitStats } from "@/hooks/use-habit-stats";

interface HabitStatsGridProps {
  stats: HabitStats;
  color: string;
  loading: boolean;
}

interface StatItemProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  color: string;
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <Card className="relative overflow-hidden py-4">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color, opacity: 0.7 }} />
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle"
          style={{ backgroundColor: `${color}14` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
        </div>
      </div>
    </Card>
  );
}

export function HabitStatsGrid({ stats, color, loading }: HabitStatsGridProps) {
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
      <StatItem
        icon={Flame}
        label="Current Streak"
        value={stats.currentStreak}
        color={color}
      />
      <StatItem
        icon={Trophy}
        label="Best Streak"
        value={stats.bestStreak}
        color={color}
      />
      <StatItem
        icon={Hash}
        label="Total"
        value={stats.totalCompletions}
        color={color}
      />
      <StatItem
        icon={TrendingUp}
        label="Completion Rate"
        value={`${stats.completionRate}%`}
        color={color}
      />
    </div>
  );
}

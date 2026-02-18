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
    <Card className="flex flex-col items-center text-center py-4">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="text-xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
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

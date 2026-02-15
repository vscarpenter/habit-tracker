"use client";

import { Card } from "@/components/ui/card";
import { Flame, Target, TrendingUp } from "lucide-react";

interface QuickStatsGridProps {
  todayProgress: number;
  completedCount: number;
  scheduledCount: number;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <div className="text-lg font-bold text-text-primary">{value}</div>
        <div className="text-xs text-text-muted">{label}</div>
      </div>
    </Card>
  );
}

export function QuickStatsGrid({
  todayProgress,
  completedCount,
  scheduledCount,
}: QuickStatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <StatCard
        icon={Target}
        label="Today"
        value={`${completedCount}/${scheduledCount}`}
        color="#3b82f6"
      />
      <StatCard
        icon={TrendingUp}
        label="Progress"
        value={`${todayProgress}%`}
        color="#10b981"
      />
      <StatCard
        icon={Flame}
        label="Scheduled"
        value={`${scheduledCount}`}
        color="#f59e0b"
      />
    </div>
  );
}

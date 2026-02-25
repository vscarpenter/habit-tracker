"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/stats-utils";

interface HabitLeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
}

const DEFAULT_VISIBLE = 10;

export function HabitLeaderboard({ entries, loading }: HabitLeaderboardProps) {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top habits ranked by completion rate in this range</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  const visible = showAll ? entries : entries.slice(0, DEFAULT_VISIBLE);
  const hasMore = entries.length > DEFAULT_VISIBLE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>Top habits ranked by completion rate in this range</CardDescription>
      </CardHeader>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">No habits to rank yet.</p>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((entry, index) => (
              <div
                key={entry.habit.id}
                className="hf-row flex items-center gap-3 rounded-xl px-3 py-3"
              >
                {/* Rank */}
                <span className="w-6 shrink-0 text-right text-sm font-semibold text-text-muted">
                  {index + 1}
                </span>

                {/* Icon + Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg shrink-0">{entry.habit.icon}</span>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {entry.habit.name}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-20 shrink-0 rounded-full bg-border-subtle sm:w-28">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${entry.completionRate}%`,
                      backgroundColor: entry.habit.color,
                    }}
                  />
                </div>

                {/* Rate */}
                <span className="text-sm font-medium text-text-primary w-10 text-right shrink-0">
                  {entry.completionRate}%
                </span>

                {/* Streak */}
                <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border-subtle/70 bg-surface-paper/50 px-2 py-0.5">
                  <Flame className="h-3.5 w-3.5" style={{ color: "var(--chart-4)" }} />
                  <span className="text-xs text-text-muted">
                    {entry.currentStreak}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show less" : `Show all ${entries.length}`}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
      </CardHeader>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">No habits to rank yet.</p>
      ) : (
        <>
          <div className="divide-y divide-border-subtle">
            {visible.map((entry, index) => (
              <div
                key={entry.habit.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* Rank */}
                <span className="text-sm font-semibold text-text-muted w-6 text-right shrink-0">
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
                <div className="w-20 sm:w-28 h-2 rounded-full bg-border-subtle shrink-0">
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
                <div className="flex items-center gap-0.5 shrink-0">
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

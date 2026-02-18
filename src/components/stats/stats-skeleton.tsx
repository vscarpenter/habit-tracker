"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Date range buttons */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-12 rounded-lg" />
        ))}
      </div>

      {/* Overall stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      {/* Trend chart */}
      <Skeleton className="h-72 rounded-2xl" />

      {/* Heatmap */}
      <Skeleton className="h-40 rounded-2xl" />

      {/* Two-column charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      {/* Leaderboard */}
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

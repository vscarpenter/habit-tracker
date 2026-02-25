"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CategoryBreakdownEntry } from "@/lib/stats-utils";

interface CategoryBreakdownProps {
  data: CategoryBreakdownEntry[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Habit mix and completion performance by category</CardDescription>
        </CardHeader>
        <p className="text-sm text-text-muted">
          No active habits to categorize.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Habit mix and completion performance by category</CardDescription>
      </CardHeader>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="h-48 w-48 shrink-0 rounded-2xl border border-border-subtle/70 bg-surface-paper/45 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="habitCount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "var(--shadow-editorial-md)",
                  }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  `${value ?? 0} habit${value !== 1 ? "s" : ""}`,
                  name ?? "",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {data.map((entry) => (
            <div
              key={entry.category}
              className="flex items-center gap-2 rounded-xl border border-border-subtle/70 bg-surface-overlay/50 px-2.5 py-2"
            >
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-text-primary truncate">
                {entry.category}
              </span>
              <span className="text-xs text-text-muted ml-auto whitespace-nowrap">
                {entry.habitCount} · {entry.completionRate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

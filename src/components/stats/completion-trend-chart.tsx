"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DailyCompletionEntry } from "@/lib/stats-utils";

interface CompletionTrendChartProps {
  data: DailyCompletionEntry[];
}

/** Picks an x-axis tick interval that avoids label crowding at any range. */
function pickLabelInterval(pointCount: number): number {
  if (pointCount > 60) return 13;  // ~90D/1Y: biweekly labels
  if (pointCount > 14) return 6;   // ~30D: weekly labels
  return 1;                         // 7D: every day
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const labelInterval = pickLabelInterval(data.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Completions</CardTitle>
        <CardDescription>Completion volume across the selected date range</CardDescription>
      </CardHeader>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 4" />
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              interval={labelInterval}
              tickFormatter={(d: string) => d.slice(5)} // "MM-DD"
            />
            <YAxis
              allowDecimals={false}
              domain={[0, maxCount]}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "var(--shadow-editorial-md)",
              }}
              labelFormatter={(d) => String(d)}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              fill="url(#trendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

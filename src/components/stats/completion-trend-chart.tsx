"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyCompletionEntry } from "@/lib/stats-utils";

interface CompletionTrendChartProps {
  data: DailyCompletionEntry[];
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Show abbreviated dates on x-axis: show every Nth label to avoid crowding
  const labelInterval = data.length > 60 ? 13 : data.length > 14 ? 6 : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Completions</CardTitle>
      </CardHeader>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
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
              }}
              labelFormatter={(d) => String(d)}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#trendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

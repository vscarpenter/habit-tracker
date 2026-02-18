"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMonthlyCompletionData } from "@/lib/date-utils";
import type { HabitCompletion } from "@/types";

interface HabitMonthlyChartProps {
  completions: HabitCompletion[];
  color: string;
}

export function HabitMonthlyChart({ completions, color }: HabitMonthlyChartProps) {
  const data = useMemo(
    () => buildMonthlyCompletionData(completions, 6),
    [completions]
  );

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Completions</CardTitle>
      </CardHeader>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
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
            />
            <Bar
              dataKey="count"
              fill={color}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

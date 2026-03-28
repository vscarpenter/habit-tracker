"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { EffortTrendEntry } from "@/lib/stats-utils";

interface EffortTrendChartProps {
  data: EffortTrendEntry[];
}

export function EffortTrendChart({ data }: EffortTrendChartProps) {
  // Group by habit for separate lines
  const { chartData, habits } = useMemo(() => {
    const habitSet = new Map<string, { name: string; color: string }>();
    const dateMap = new Map<string, Record<string, string | number>>();

    for (const entry of data) {
      habitSet.set(entry.habitId, { name: entry.habitName, color: entry.habitColor });
      const row = dateMap.get(entry.date) ?? { date: entry.date };
      row[entry.habitId] = entry.effort;
      dateMap.set(entry.date, row);
    }

    const chartData = Array.from(dateMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
    const habits = Array.from(habitSet.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));

    return { chartData, habits };
  }, [data]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effort Over Time</CardTitle>
        <CardDescription>Self-reported effort ratings (habits with 5+ ratings)</CardDescription>
      </CardHeader>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 4" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(d: string) => d.slice(5)}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
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
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
            />
            {habits.map((habit) => (
              <Line
                key={habit.id}
                type="monotone"
                dataKey={habit.id}
                name={habit.name}
                stroke={habit.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

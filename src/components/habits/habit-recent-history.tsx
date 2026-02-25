"use client";

import { useMemo } from "react";
import { parseISO, format, subDays, isToday, isYesterday } from "date-fns";
import { Check, Circle, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit, HabitCompletion } from "@/types";

interface HabitRecentHistoryProps {
  habit: Habit;
  completions: HabitCompletion[];
  today: string;
}

const DAYS_TO_SHOW = 14;

function formatDayLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

export function HabitRecentHistory({
  habit,
  completions,
  today,
}: HabitRecentHistoryProps) {
  const days = useMemo(() => {
    const completionMap = new Map<string, HabitCompletion>();
    for (const c of completions) {
      if (c.habitId === habit.id) {
        completionMap.set(c.date, c);
      }
    }

    const todayDate = parseISO(today);
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
      const dateStr = format(subDays(todayDate, i), "yyyy-MM-dd");
      const scheduled = isHabitScheduledForDate(habit, dateStr);
      const completion = completionMap.get(dateStr);
      return { dateStr, scheduled, completion };
    });
  }, [habit, completions, today]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent History</CardTitle>
        <CardDescription>Last {DAYS_TO_SHOW} days for this habit</CardDescription>
      </CardHeader>

      <div className="space-y-2">
        {days.map(({ dateStr, scheduled, completion }) => (
          <div
            key={dateStr}
            className="hf-row flex items-center gap-3 rounded-xl px-3 py-2.5"
          >
            {/* Status icon */}
            {!scheduled ? (
              <Minus className="h-5 w-5 text-text-muted/40 shrink-0" />
            ) : completion ? (
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: habit.color }}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : (
              <Circle className="h-5 w-5 text-text-muted/50 shrink-0" />
            )}

            {/* Date label */}
            <span
              className={cn(
                "text-sm flex-1",
                !scheduled
                  ? "text-text-muted"
                  : completion
                    ? "text-text-primary"
                    : "text-text-secondary"
              )}
            >
              {formatDayLabel(dateStr)}
            </span>

            {/* Note */}
            {completion?.note && (
              <span className="text-xs text-text-muted truncate max-w-[120px]">
                {completion.note}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

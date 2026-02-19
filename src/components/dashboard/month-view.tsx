"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { MonthCell } from "./month-cell";
import { NoHabitsEmpty } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit } from "@/types";

interface MonthViewProps {
  habits: Habit[];
  monthDates: string[];
  today: string;
  isCompleted: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
  loading: boolean;
}

export function MonthView({
  habits,
  monthDates,
  today,
  isCompleted,
  onToggle,
  loading,
}: MonthViewProps) {
  const activeHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [habits]
  );

  const daysCount = monthDates.length;

  if (loading) {
    return <MonthSkeleton daysCount={daysCount} />;
  }

  if (activeHabits.length === 0) {
    return <NoHabitsEmpty />;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div
        className={cn(
          "bg-surface-elevated backdrop-blur-xl border border-border rounded-2xl",
          "p-3 sm:p-4"
        )}
      >
        <div
          className="grid gap-x-0 gap-y-0"
          style={{
            gridTemplateColumns: `140px repeat(${daysCount}, minmax(28px, 1fr))`,
            minWidth: `${140 + daysCount * 30}px`,
          }}
        >
          {/* Header row: day numbers */}
          <div />
          {monthDates.map((date) => {
            const isToday = date === today;
            const dayNum = format(parseISO(date), "d");
            return (
              <div
                key={date}
                className={cn(
                  "flex items-center justify-center h-8 text-[10px] font-medium",
                  isToday
                    ? "text-accent-blue font-bold"
                    : "text-text-muted"
                )}
              >
                {dayNum}
              </div>
            );
          })}

          {/* Habit rows */}
          {activeHabits.map((habit, idx) => (
            <MonthHabitRow
              key={habit.id}
              habit={habit}
              monthDates={monthDates}
              today={today}
              isCompleted={isCompleted}
              onToggle={onToggle}
              isLast={idx === activeHabits.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MonthHabitRowProps {
  habit: Habit;
  monthDates: string[];
  today: string;
  isCompleted: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
  isLast: boolean;
}

function MonthHabitRow({
  habit,
  monthDates,
  today,
  isCompleted,
  onToggle,
  isLast,
}: MonthHabitRowProps) {
  return (
    <>
      <Link
        href={`/habits/${habit.id}`}
        className={cn(
          "flex items-center gap-2 min-h-[36px] pr-2 sticky left-0",
          "bg-surface-elevated z-10",
          !isLast && "border-b border-border-subtle/30"
        )}
      >
        <span className="text-sm shrink-0">{habit.icon}</span>
        <span className="text-xs font-medium text-text-primary truncate">
          {habit.name}
        </span>
      </Link>

      {monthDates.map((date) => {
        const scheduled = isHabitScheduledForDate(habit, date);
        const isFuture = date > today;
        return (
          <div
            key={date}
            className={cn(
              "flex items-center justify-center min-h-[36px]",
              date === today && "bg-accent-blue/5",
              !isLast && "border-b border-border-subtle/30"
            )}
          >
            <MonthCell
              scheduled={scheduled && !isFuture}
              completed={isCompleted(habit.id, date)}
              color={habit.color}
              onToggle={() => onToggle(habit.id, date)}
            />
          </div>
        );
      })}
    </>
  );
}

function MonthSkeleton({ daysCount }: { daysCount: number }) {
  return (
    <div className="rounded-2xl bg-surface-elevated border border-border p-4 space-y-3">
      <div className="flex gap-1">
        <Skeleton className="h-6 w-[140px] rounded-lg" />
        {Array.from({ length: Math.min(daysCount, 15) }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-7 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-1">
          <Skeleton className="h-8 w-[140px] rounded-lg" />
          {Array.from({ length: Math.min(daysCount, 15) }).map((_, j) => (
            <Skeleton key={j} className="h-7 w-7 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

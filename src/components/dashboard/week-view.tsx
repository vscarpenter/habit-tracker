"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { WeekCell } from "./week-cell";
import { NoHabitsEmpty } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import type { Habit } from "@/types";

interface WeekViewProps {
  habits: Habit[];
  weekDates: string[];
  today: string;
  isCompleted: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
  loading: boolean;
}

export function WeekView({
  habits,
  weekDates,
  today,
  isCompleted,
  onToggle,
  loading,
}: WeekViewProps) {
  const activeHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [habits]
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-8 gap-2">
          <Skeleton className="h-8 rounded-lg" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-8 gap-2">
            <Skeleton className="h-11 rounded-lg" />
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-11 rounded-full mx-auto w-8" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return <NoHabitsEmpty />;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div
        className="grid gap-x-1 gap-y-0 min-w-[520px]"
        style={{
          gridTemplateColumns: "140px repeat(7, minmax(44px, 1fr))",
        }}
      >
        {/* Header row */}
        <div /> {/* Empty cell for habit name column */}
        {weekDates.map((date) => {
          const isToday = date === today;
          const parsed = parseISO(date);
          return (
            <div
              key={date}
              className={cn(
                "flex flex-col items-center py-2 rounded-xl text-center",
                isToday && "bg-accent-blue/10"
              )}
            >
              <span className="text-[10px] font-medium text-text-muted uppercase">
                {format(parsed, "EEE")}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold mt-0.5",
                  isToday ? "text-accent-blue" : "text-text-primary"
                )}
              >
                {format(parsed, "d")}
              </span>
            </div>
          );
        })}

        {/* Habit rows */}
        {activeHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            weekDates={weekDates}
            today={today}
            isCompleted={isCompleted}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

interface HabitRowProps {
  habit: Habit;
  weekDates: string[];
  today: string;
  isCompleted: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
}

function HabitRow({ habit, weekDates, today, isCompleted, onToggle }: HabitRowProps) {
  return (
    <>
      {/* Sticky name column */}
      <Link
        href={`/habits/${habit.id}`}
        className="flex items-center gap-2 min-h-[44px] pr-2 sticky left-0 bg-background z-10"
      >
        <span className="text-base shrink-0">{habit.icon}</span>
        <span className="text-sm font-medium text-text-primary truncate">
          {habit.name}
        </span>
      </Link>

      {/* 7 day cells */}
      {weekDates.map((date) => {
        const scheduled = isHabitScheduledForDate(habit, date);
        const isFuture = date > today;
        return (
          <WeekCell
            key={date}
            scheduled={scheduled && !isFuture}
            completed={isCompleted(habit.id, date)}
            color={habit.color}
            onToggle={() => onToggle(habit.id, date)}
          />
        );
      })}
    </>
  );
}

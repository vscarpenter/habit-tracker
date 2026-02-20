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
        className={cn(
          "bg-surface-elevated/90 backdrop-blur-xl border border-border-subtle rounded-2xl",
          "shadow-sm"
        )}
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle/70 px-4 py-3 text-xs text-text-secondary">
          <LegendItem label="Completed" colorClass="bg-accent-blue" />
          <LegendItem label="Scheduled" colorClass="bg-surface-muted border border-border-subtle" />
          <LegendItem label="Future" colorClass="bg-transparent border border-text-muted/45" />
          <LegendItem label="Not scheduled" colorClass="bg-text-muted/35" />
        </div>

        <div
          className="grid gap-x-1.5 gap-y-0 min-w-[620px] p-3 sm:p-4"
          style={{
            gridTemplateColumns: "170px repeat(7, minmax(56px, 1fr))",
          }}
        >
          {/* Header row */}
          <div className="flex items-center px-2 text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
            Habits
          </div>
          {weekDates.map((date) => {
            const isToday = date === today;
            const parsed = parseISO(date);
            return (
              <div
                key={date}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-xl border text-center",
                  isToday
                    ? "border-accent-blue/35 bg-accent-blue/10"
                    : "border-border-subtle/65 bg-surface/45"
                )}
              >
                <span className="text-[10px] font-semibold text-text-muted uppercase">
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
          {activeHabits.map((habit, idx) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              weekDates={weekDates}
              today={today}
              isCompleted={isCompleted}
              onToggle={onToggle}
              rowIndex={idx}
              isLast={idx === activeHabits.length - 1}
            />
          ))}
        </div>
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
  rowIndex: number;
  isLast: boolean;
}

function HabitRow({
  habit,
  weekDates,
  today,
  isCompleted,
  onToggle,
  rowIndex,
  isLast,
}: HabitRowProps) {
  return (
    <>
      {/* Sticky name column */}
      <Link
        href={`/habits/${habit.id}`}
        className={cn(
          "flex items-center gap-2.5 min-h-[52px] px-2.5 sticky left-0 rounded-lg border-l-2",
          "z-10 backdrop-blur-xl transition-colors duration-150",
          rowIndex % 2 === 0 ? "bg-surface/75" : "bg-surface-muted/40",
          "hover:bg-surface-strong",
          !isLast && "border-b border-border-subtle/50"
        )}
        style={{ borderLeftColor: habit.color }}
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
        const completed = isCompleted(habit.id, date);
        return (
          <div
            key={date}
            className={cn(
              "rounded-lg",
              rowIndex % 2 === 0 ? "bg-surface/45" : "bg-surface-muted/30",
              !isLast && "border-b border-border-subtle/45"
            )}
          >
            <WeekCell
              scheduled={scheduled}
              completed={completed}
              color={habit.color}
              isToday={date === today}
              isFuture={isFuture}
              onToggle={() => onToggle(habit.id, date)}
            />
          </div>
        );
      })}
    </>
  );
}

function LegendItem({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", colorClass)} />
      <span>{label}</span>
    </div>
  );
}

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
          "hf-panel rounded-3xl"
        )}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle/70 bg-surface-paper/35 px-4 py-3 text-xs text-text-secondary">
          <LegendChip label="Done" className="bg-accent-blue" />
          <LegendChip label="Scheduled" className="bg-surface-muted border border-border-subtle" />
          <LegendChip label="Future" className="bg-transparent border border-text-muted/45" />
          <LegendChip label="No schedule" className="bg-text-muted/35" />
        </div>

        <div
          className="grid gap-x-0 gap-y-0 p-3 sm:p-4"
          style={{
            gridTemplateColumns: `168px repeat(${daysCount}, minmax(30px, 1fr))`,
            minWidth: `${168 + daysCount * 32}px`,
          }}
        >
          {/* Header row: day numbers */}
          <div className="flex items-center px-2 text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
            Habits
          </div>
          {monthDates.map((date) => {
            const isToday = date === today;
            const parsed = parseISO(date);
            const dayNum = format(parsed, "d");
            return (
              <div
                key={date}
                className={cn(
                  "flex h-10 flex-col items-center justify-center rounded-md border text-[10px]",
                  isToday
                    ? "border-accent-blue/40 bg-accent-blue/8 text-accent-blue font-bold shadow-[var(--shadow-editorial-sm)]"
                    : "border-border-subtle/60 bg-surface-paper/40 text-text-muted"
                )}
              >
                {dayNum}
                <span className="text-[9px] opacity-70">{format(parsed, "EEEEE")}</span>
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
              rowIndex={idx}
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
  rowIndex: number;
  isLast: boolean;
}

function MonthHabitRow({
  habit,
  monthDates,
  today,
  isCompleted,
  onToggle,
  rowIndex,
  isLast,
}: MonthHabitRowProps) {
  return (
    <>
      <Link
        href={`/habits/${habit.id}`}
        className={cn(
          "flex items-center gap-2 min-h-[40px] px-2 sticky left-0 rounded-md border-l-2",
          "z-10 backdrop-blur-xl",
          rowIndex % 2 === 0 ? "bg-surface-paper/72" : "bg-surface-overlay/72",
          !isLast && "border-b border-border-subtle/45"
        )}
        style={{ borderLeftColor: habit.color }}
      >
        <span className="text-sm shrink-0">{habit.icon}</span>
        <span className="text-xs font-medium text-text-primary truncate">
          {habit.name}
        </span>
      </Link>

      {monthDates.map((date) => {
        const scheduled = isHabitScheduledForDate(habit, date);
        const isFuture = date > today;
        const completed = isCompleted(habit.id, date);
        return (
          <div
            key={date}
            className={cn(
              "flex items-center justify-center min-h-[40px] rounded-md",
              rowIndex % 2 === 0 ? "bg-surface-paper/30" : "bg-surface-overlay/28",
              date === today && "bg-accent-blue/7",
              !isLast && "border-b border-border-subtle/45"
            )}
          >
            <MonthCell
              scheduled={scheduled}
              completed={completed}
              color={habit.color}
              isFuture={isFuture}
              isToday={date === today}
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
    <div className="hf-panel rounded-2xl p-4 space-y-3">
      <div className="flex gap-1">
        <Skeleton className="h-8 w-[168px] rounded-lg" />
        {Array.from({ length: Math.min(daysCount, 15) }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-1">
          <Skeleton className="h-10 w-[168px] rounded-lg" />
          {Array.from({ length: Math.min(daysCount, 15) }).map((_, j) => (
            <Skeleton key={j} className="h-8 w-8 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

function LegendChip({ label, className }: { label: string; className: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle/70 bg-surface-paper/50 px-2 py-1">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      <span>{label}</span>
    </div>
  );
}

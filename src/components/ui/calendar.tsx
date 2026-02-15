"use client";

import { useMemo, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  weekStartsOn?: 0 | 1;
  className?: string;
}

function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  weekStartsOn = 0,
  className,
}: CalendarProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calStart = startOfWeek(monthStart, { weekStartsOn });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [month, weekStartsOn]);

  const dayLabels = useMemo(() => {
    const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (weekStartsOn === 1) {
      return [...base.slice(1), base[0]];
    }
    return base;
  }, [weekStartsOn]);

  const goToPrevMonth = useCallback(
    () => onMonthChange(subMonths(month, 1)),
    [month, onMonthChange]
  );

  const goToNextMonth = useCallback(
    () => onMonthChange(addMonths(month, 1)),
    [month, onMonthChange]
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-text-primary">
          {format(month, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-text-muted py-1"
          >
            {label.charAt(0)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, month);
          const isSelected = selected && isSameDay(day, selected);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              disabled={!isCurrentMonth}
              className={cn(
                "h-8 w-8 mx-auto rounded-lg text-sm transition-colors duration-150",
                "flex items-center justify-center",
                !isCurrentMonth && "text-text-muted/40 cursor-default",
                isCurrentMonth && !isSelected && "text-text-primary hover:bg-surface",
                isToday && !isSelected && "font-semibold text-accent-blue",
                isSelected &&
                  "bg-accent-blue text-white font-semibold"
              )}
              aria-label={format(day, "MMMM d, yyyy")}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };

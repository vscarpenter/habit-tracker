"use client";

import { useMemo, useState } from "react";
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { MonthView } from "@/components/dashboard/month-view";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { useHabits } from "@/hooks/use-habits";
import { useWeekCompletions } from "@/hooks/use-week-completions";
import { useKeyboardShortcuts, type ShortcutConfig } from "@/hooks/use-keyboard-shortcuts";

export default function MonthPage() {
  const today = useToday();
  const [monthOffset, setMonthOffset] = useState(0);

  const monthStart = useMemo(() => {
    const base = startOfMonth(new Date(today));
    return addMonths(base, monthOffset);
  }, [today, monthOffset]);

  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);

  const monthDates = useMemo(
    () =>
      eachDayOfInterval({ start: monthStart, end: monthEnd }).map((d) =>
        format(d, "yyyy-MM-dd")
      ),
    [monthStart, monthEnd]
  );

  const startDate = monthDates[0];
  const endDate = monthDates[monthDates.length - 1];

  const { habits, loading: habitsLoading } = useHabits();
  const { loading: completionsLoading, isCompleted, toggle } =
    useWeekCompletions(startDate, endDate);

  const isCurrentMonth = monthOffset === 0;
  const monthLabel = format(monthStart, "MMMM yyyy");

  const arrowShortcuts = useMemo<ShortcutConfig[]>(
    () => [
      { key: "ArrowLeft", handler: () => setMonthOffset((o) => o - 1) },
      { key: "ArrowRight", handler: () => setMonthOffset((o) => o + 1) },
    ],
    []
  );

  useKeyboardShortcuts(arrowShortcuts);

  return (
    <PageContainer>
      <Header
        title="Month"
        subtitle={monthLabel}
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthOffset((o) => o - 1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {!isCurrentMonth && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMonthOffset(0)}
              >
                Today
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthOffset((o) => o + 1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        }
      />
      <MonthView
        habits={habits}
        monthDates={monthDates}
        today={today}
        loading={habitsLoading || completionsLoading}
        isCompleted={isCompleted}
        onToggle={toggle}
      />
    </PageContainer>
  );
}

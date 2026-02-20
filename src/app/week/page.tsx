"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { WeekView } from "@/components/dashboard/week-view";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { useSettings } from "@/hooks/use-settings";
import { useHabits } from "@/hooks/use-habits";
import { useWeekCompletions } from "@/hooks/use-week-completions";
import { useKeyboardShortcuts, type ShortcutConfig } from "@/hooks/use-keyboard-shortcuts";
import { getWeekStart, getWeekDates } from "@/lib/date-utils";

export default function WeekPage() {
  const today = useToday();
  const { settings } = useSettings();
  const weekStartsOn = settings?.weekStartsOn ?? 0;

  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const base = getWeekStart(today, weekStartsOn);
    return addDays(base, weekOffset * 7);
  }, [today, weekStartsOn, weekOffset]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  const { habits, loading: habitsLoading } = useHabits();
  const { loading: completionsLoading, isCompleted, toggle } =
    useWeekCompletions(startDate, endDate);

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  const arrowShortcuts = useMemo<ShortcutConfig[]>(
    () => [
      { key: "ArrowLeft", handler: () => setWeekOffset((o) => o - 1) },
      { key: "ArrowRight", handler: () => setWeekOffset((o) => o + 1) },
    ],
    []
  );

  useKeyboardShortcuts(arrowShortcuts);

  return (
    <PageContainer>
      <Header
        title="Week"
        subtitle={weekLabel}
        eyebrow="Planning View"
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((o) => o - 1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {!isCurrentWeek && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWeekOffset(0)}
              >
                Today
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label="Next week"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        }
      />
      <WeekView
        habits={habits}
        weekDates={weekDates}
        today={today}
        loading={habitsLoading || completionsLoading}
        isCompleted={isCompleted}
        onToggle={toggle}
      />
    </PageContainer>
  );
}

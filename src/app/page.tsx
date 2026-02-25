"use client";

import { useMemo } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { TodayView } from "@/components/dashboard/today-view";
import { useHabits } from "@/hooks/use-habits";
import { useCompletions } from "@/hooks/use-completions";
import { useToday } from "@/hooks/use-today";
import { useSettings } from "@/hooks/use-settings";
import { useStreaks } from "@/hooks/use-streaks";
import { useKeyboardShortcuts, type ShortcutConfig } from "@/hooks/use-keyboard-shortcuts";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import { format, parseISO } from "date-fns";

const MAX_DIGIT_SHORTCUTS = 9;
const AFTERNOON_HOUR = 12;
const EVENING_HOUR = 18;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < AFTERNOON_HOUR) return "Good morning";
  if (hour < EVENING_HOUR) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const today = useToday();
  const { habits, loading: habitsLoading } = useHabits();
  const { completions, loading: completionsLoading, toggle, isCompleted } =
    useCompletions(today);
  const { settings } = useSettings();
  const showStreaks = settings?.showStreaks ?? true;
  const { streakMap } = useStreaks(habits, today);

  const formatted = `${getGreeting()} — ${format(parseISO(today), "EEEE, MMMM d")}`;

  const scheduledHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.isArchived && isHabitScheduledForDate(h, today))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [habits, today]
  );

  const digitShortcuts = useMemo<ShortcutConfig[]>(
    () =>
      scheduledHabits.slice(0, MAX_DIGIT_SHORTCUTS).map((habit, i) => ({
        key: String(i + 1),
        handler: () => toggle(habit.id),
      })),
    [scheduledHabits, toggle]
  );

  useKeyboardShortcuts(digitShortcuts);

  return (
    <PageContainer>
      <Header
        title="Today"
        subtitle={formatted}
        eyebrow="Daily Focus"
        accentColor="var(--accent-blue)"
      />
      <TodayView
        habits={habits}
        completions={completions}
        today={today}
        loading={habitsLoading || completionsLoading}
        onToggle={toggle}
        isCompleted={isCompleted}
        showStreaks={showStreaks}
        streakMap={streakMap}
      />
    </PageContainer>
  );
}

"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { TodayView } from "@/components/dashboard/today-view";
import { useHabits } from "@/hooks/use-habits";
import { useCompletions } from "@/hooks/use-completions";
import { useToday } from "@/hooks/use-today";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const today = useToday();
  const { habits, loading: habitsLoading } = useHabits();
  const { completions, loading: completionsLoading, toggle, isCompleted } =
    useCompletions(today);

  const formatted = format(parseISO(today), "EEEE, MMMM d");

  return (
    <PageContainer>
      <Header title="Today" subtitle={formatted} />
      <TodayView
        habits={habits}
        completions={completions}
        today={today}
        loading={habitsLoading || completionsLoading}
        onToggle={toggle}
        isCompleted={isCompleted}
      />
    </PageContainer>
  );
}

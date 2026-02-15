"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { HabitForm } from "@/components/habits/habit-form";
import { useHabits } from "@/hooks/use-habits";
import { useToast } from "@/components/shared/toast";
import { MAX_ACTIVE_HABITS, HABIT_WARN_THRESHOLD } from "@/lib/utils";

export default function NewHabitPage() {
  const router = useRouter();
  const { create, activeHabits } = useHabits();
  const { toast } = useToast();

  const handleSubmit = async (data: Parameters<typeof create>[0]) => {
    if (activeHabits.length >= MAX_ACTIVE_HABITS) {
      toast(`Maximum of ${MAX_ACTIVE_HABITS} active habits reached.`, "error");
      return;
    }

    await create(data);

    if (activeHabits.length >= HABIT_WARN_THRESHOLD) {
      toast(`Habit created! You have ${activeHabits.length + 1} active habits.`, "info");
    } else {
      toast("Habit created!", "success");
    }

    router.push("/");
  };

  return (
    <PageContainer>
      <Header title="New Habit" subtitle="Create a new habit to track" />
      <div className="max-w-xl">
        <HabitForm onSubmit={handleSubmit} submitLabel="Create Habit" />
      </div>
    </PageContainer>
  );
}

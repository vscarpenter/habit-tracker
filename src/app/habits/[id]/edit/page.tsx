"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { HabitForm } from "@/components/habits/habit-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useHabits } from "@/hooks/use-habits";
import { useToast } from "@/components/shared/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { Habit } from "@/types";

export default function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { habits, update, archive, loading } = useHabits();
  const { toast } = useToast();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    if (!loading) {
      const found = habits.find((h) => h.id === id);
      setHabit(found ?? null);
    }
  }, [habits, id, loading]);

  const handleSubmit = async (data: Parameters<typeof update>[1]) => {
    try {
      await update(id, data);
      toast("Changes saved!", "success");
      router.push("/habits");
    } catch (error) {
      logger.error("Failed to update habit:", error);
      toast(DB_ERROR_MSG, "error");
    }
  };

  const handleArchive = async () => {
    try {
      await archive(id);
      toast("Habit archived. You can restore it from the habits list.", "success");
      router.push("/habits");
    } catch (error) {
      logger.error("Failed to archive habit:", error);
      toast(DB_ERROR_MSG, "error");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4 max-w-xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!habit) {
    return (
      <PageContainer>
        <Header title="Habit not found" eyebrow="Habit Library" accentColor="var(--accent-emerald)" />
        <p className="text-text-secondary text-sm">
          This habit may have been deleted.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header
        title="Edit Habit"
        subtitle={habit.name}
        eyebrow="Habit Library"
        accentColor="var(--accent-emerald)"
      />
      <div className="max-w-xl space-y-6">
        <HabitForm
          initialData={habit}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />

        {!habit.isArchived && (
          <div className="hf-panel-muted rounded-2xl border-0 p-4 pt-4">
            <Button
              variant="destructive"
              onClick={() => setShowArchive(true)}
              className="w-full sm:w-auto"
            >
              Archive Habit
            </Button>
          </div>
        )}

        <ConfirmDialog
          open={showArchive}
          onOpenChange={setShowArchive}
          title={`Archive "${habit.name}"?`}
          description="You can restore it later from the habits list."
          confirmLabel="Archive"
          variant="destructive"
          onConfirm={handleArchive}
        />
      </div>
    </PageContainer>
  );
}

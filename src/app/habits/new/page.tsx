import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";

export default function NewHabitPage() {
  return (
    <PageContainer>
      <Header title="New Habit" subtitle="Create a new habit to track" />
      <div className="text-text-secondary text-sm">
        Habit creation form coming in Phase 2.
      </div>
    </PageContainer>
  );
}

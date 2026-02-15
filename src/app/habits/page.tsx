import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";

export default function HabitsPage() {
  return (
    <PageContainer>
      <Header title="Habits" subtitle="Manage your habits" />
      <div className="text-text-secondary text-sm">
        Habit management coming in Phase 2.
      </div>
    </PageContainer>
  );
}

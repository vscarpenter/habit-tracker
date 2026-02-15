import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";

export default function DashboardPage() {
  const today = new Date();
  const formatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageContainer>
      <Header title="Today" subtitle={formatted} />
      <div className="text-text-secondary text-sm">
        Dashboard coming in Phase 2.
      </div>
    </PageContainer>
  );
}

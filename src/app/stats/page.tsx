import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";

export default function StatsPage() {
  return (
    <PageContainer>
      <Header title="Statistics" subtitle="Track your progress over time" />
      <div className="text-text-secondary text-sm">
        Statistics dashboard coming in Phase 4.
      </div>
    </PageContainer>
  );
}

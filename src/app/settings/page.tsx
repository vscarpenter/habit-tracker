import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";

export default function SettingsPage() {
  return (
    <PageContainer>
      <Header title="Settings" subtitle="Customize your experience" />
      <div className="text-text-secondary text-sm">
        Settings page coming in Phase 5.
      </div>
    </PageContainer>
  );
}

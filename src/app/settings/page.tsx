"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { SettingsContent } from "@/components/settings/settings-content";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <PageContainer>
        <Header
          title="Settings"
          subtitle="Customize your experience"
          eyebrow="Preferences"
          accentColor="var(--accent-amber)"
        />
        <SettingsContent />
      </PageContainer>
    </ErrorBoundary>
  );
}

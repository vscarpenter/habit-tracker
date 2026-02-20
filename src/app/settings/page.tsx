"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { SettingsContent } from "@/components/settings/settings-content";

export default function SettingsPage() {
  return (
    <PageContainer>
      <Header
        title="Settings"
        subtitle="Customize your experience"
        eyebrow="Preferences"
      />
      <SettingsContent />
    </PageContainer>
  );
}

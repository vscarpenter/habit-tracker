"use client";

import { useSettings } from "@/hooks/use-settings";
import { useThemeContext } from "@/components/layout/theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { DataManagement } from "./data-management";
import { AboutSection } from "./about-section";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { Theme } from "@/types";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface-elevated backdrop-blur-xl border border-border p-5 space-y-4">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function SettingsContent() {
  const { settings, loading, update } = useSettings();
  const { theme, setTheme } = useThemeContext();

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    update({ theme: newTheme });
  }

  return (
    <div className="space-y-6">
      <Card title="Appearance">
        <ThemeToggle theme={theme} onChange={handleThemeChange} />
      </Card>

      <Card title="Preferences">
        <SettingRow
          label="Week starts on Monday"
          description="Affects week view and statistics"
        >
          <Switch
            checked={settings.weekStartsOn === 1}
            onCheckedChange={(checked) =>
              update({ weekStartsOn: checked ? 1 : 0 })
            }
          />
        </SettingRow>

        <SettingRow label="Show streaks" description="Display streak counts on habit cards">
          <Switch
            checked={settings.showStreaks}
            onCheckedChange={(showStreaks) => update({ showStreaks })}
          />
        </SettingRow>

        <SettingRow
          label="Show completion rate"
          description="Display completion percentages"
        >
          <Switch
            checked={settings.showCompletionRate}
            onCheckedChange={(showCompletionRate) => update({ showCompletionRate })}
          />
        </SettingRow>
      </Card>

      <Card title="Data">
        <DataManagement />
      </Card>

      <Card title="About">
        <AboutSection />
      </Card>
    </div>
  );
}

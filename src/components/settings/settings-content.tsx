"use client";

import { useSettings } from "@/hooks/use-settings";
import { useThemeContext } from "@/components/layout/theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { DataManagement } from "./data-management";
import { AboutSection } from "./about-section";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types";

const VIEW_OPTIONS = [
  { value: "today" as const, label: "Today" },
  { value: "week" as const, label: "Week" },
];

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

        <SettingRow
          label="Default view"
          description="Choose which view to show on launch"
        >
          <div className="flex gap-1" role="radiogroup" aria-label="Default view">
            {VIEW_OPTIONS.map(({ value, label }) => {
              const active = settings.defaultView === value;
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ defaultView: value })}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
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

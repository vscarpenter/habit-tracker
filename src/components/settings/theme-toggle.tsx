"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types";

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export interface ThemeToggleProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
  className?: string;
}

export function ThemeToggle({ theme, onChange, className }: ThemeToggleProps) {
  return (
    <div className={cn("flex gap-2", className)} role="radiogroup" aria-label="Theme">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(value)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
              "transition-colors duration-150",
              active
                ? "border border-accent-blue/20 bg-accent-blue/10 text-accent-blue shadow-[var(--shadow-editorial-sm)]"
                : "border border-transparent text-text-secondary hover:bg-surface-tint/70 hover:text-text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

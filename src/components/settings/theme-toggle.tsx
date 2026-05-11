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
              "flex items-center gap-2 rounded-sm px-4 py-2 text-small font-medium",
              "border transition-colors duration-150",
              active
                ? "border-accent bg-accent-tint text-accent"
                : "border-transparent text-gray-700 hover:bg-gray-100 hover:text-slate"
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

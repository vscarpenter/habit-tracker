"use client";

import { Sunrise, Sun, Moon, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeOfDay } from "@/types";

interface TimeOfDaySelectorProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
}

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; icon: typeof Sunrise }[] = [
  { value: "morning", label: "Morning", icon: Sunrise },
  { value: "afternoon", label: "Afternoon", icon: Sun },
  { value: "evening", label: "Evening", icon: Moon },
  { value: "anytime", label: "Anytime", icon: Infinity },
];

export function TimeOfDaySelector({ value, onChange }: TimeOfDaySelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Time of day">
      {TIME_OF_DAY_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all",
              "focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
              selected
                ? "border-accent-blue bg-accent-blue/8 text-accent-blue"
                : "border-border-subtle bg-surface-paper/50 text-text-muted hover:border-border hover:text-text-secondary"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Infer time-of-day from a reminder time string (HH:MM format).
 * Morning: 05:00-11:59, Afternoon: 12:00-17:59, Evening: 18:00-23:59
 */
export function inferTimeOfDay(reminderTime: string): TimeOfDay {
  const hour = parseInt(reminderTime.split(":")[0], 10);
  if (isNaN(hour)) return "anytime";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18) return "evening";
  return "anytime";
}

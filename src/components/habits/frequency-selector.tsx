"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { HabitFrequency } from "@/types";

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "specific_days", label: "Specific days" },
  { value: "x_per_week", label: "X times per week" },
];

const DAY_LABELS = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
];

interface FrequencySelectorProps {
  frequency: HabitFrequency;
  targetDays: number[];
  targetCount: number;
  onFrequencyChange: (frequency: HabitFrequency) => void;
  onTargetDaysChange: (days: number[]) => void;
  onTargetCountChange: (count: number) => void;
}

export function FrequencySelector({
  frequency,
  targetDays,
  targetCount,
  onFrequencyChange,
  onTargetDaysChange,
  onTargetCountChange,
}: FrequencySelectorProps) {
  const toggleDay = (day: number) => {
    if (targetDays.includes(day)) {
      onTargetDaysChange(targetDays.filter((d) => d !== day));
    } else {
      onTargetDaysChange([...targetDays, day].sort());
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FREQUENCY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onFrequencyChange(opt.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium border",
              "transition-colors duration-150",
              frequency === opt.value
                ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
                : "bg-surface text-text-secondary border-border-subtle hover:bg-surface-elevated"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {frequency === "specific_days" && (
        <div className="flex gap-2">
          {DAY_LABELS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={cn(
                "h-10 w-10 rounded-lg text-sm font-medium",
                "transition-colors duration-150",
                targetDays.includes(day.value)
                  ? "bg-accent-blue text-white"
                  : "bg-surface text-text-secondary border border-border-subtle hover:bg-surface-elevated"
              )}
              aria-label={`Toggle ${day.label}`}
              aria-pressed={targetDays.includes(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}

      {frequency === "x_per_week" && (
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={7}
            value={targetCount}
            onChange={(e) => onTargetCountChange(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-text-secondary">times per week</span>
        </div>
      )}
    </div>
  );
}

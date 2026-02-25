"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createHabitSchema } from "@/db/schemas";
import type { CreateHabitInput } from "@/db/schemas";
import type { Habit, HabitFrequency } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./emoji-picker";
import { ColorPicker } from "./color-picker";
import { FrequencySelector } from "./frequency-selector";
import { useToast } from "@/components/shared/toast";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";

interface HabitFormProps {
  initialData?: Habit;
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  submitLabel: string;
}

type FormErrors = Partial<Record<keyof CreateHabitInput, string>>;

function mapZodErrors(issues: { path: PropertyKey[]; message: string }[]): FormErrors {
  const fieldErrors: FormErrors = {};
  for (const issue of issues) {
    const path = issue.path[0];
    if (path && typeof path === "string") {
      fieldErrors[path as keyof CreateHabitInput] = issue.message;
    }
  }
  return fieldErrors;
}

export function HabitForm({ initialData, onSubmit, submitLabel }: HabitFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? "🏃");
  const [color, setColor] = useState(initialData?.color ?? "#3b82f6");
  const [frequency, setFrequency] = useState<HabitFrequency>(
    initialData?.frequency ?? "daily"
  );
  const [targetDays, setTargetDays] = useState<number[]>(
    initialData?.targetDays ?? []
  );
  const [targetCount, setTargetCount] = useState(initialData?.targetCount ?? 3);
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback((): CreateHabitInput | null => {
    const data: CreateHabitInput = {
      name: name.trim(),
      icon,
      color,
      frequency,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(frequency === "specific_days" ? { targetDays } : {}),
      ...(frequency === "x_per_week" ? { targetCount } : {}),
      ...(reminderTime ? { reminderTime } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
    };

    const result = createHabitSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors = mapZodErrors(result.error.issues);

      // Handle cross-field validation from the base schema
      if (frequency === "specific_days" && targetDays.length === 0) {
        fieldErrors.targetDays = "Select at least one day";
      }
      if (frequency === "x_per_week" && (!targetCount || targetCount < 1 || targetCount > 7)) {
        fieldErrors.targetCount = "Must be between 1 and 7";
      }

      setErrors(fieldErrors);

      // Scroll to first error
      const firstErrorField = formRef.current?.querySelector("[data-error]");
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });

      return null;
    }

    setErrors({});
    return result.data;
  }, [name, description, icon, color, frequency, targetDays, targetCount, reminderTime, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      logger.error("Form submission failed:", error);
      toast(DB_ERROR_MSG, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <Card variant="elevated">
        <div className="space-y-2" data-error={errors.name ? "" : undefined}>
          <p className="hf-kicker">Essentials</p>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Run"
            maxLength={100}
            autoFocus
          />
          {errors.name && (
            <p className="text-xs text-error">{errors.name}</p>
          )}
        </div>
      </Card>

      {/* Description */}
      <Card>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            maxLength={500}
          />
        </div>
      </Card>

      {/* Icon */}
      <Card>
        <div className="space-y-2" data-error={errors.icon ? "" : undefined}>
          <p className="hf-kicker">Identity</p>
          <Label>Icon</Label>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-paper text-3xl shadow-[var(--shadow-editorial-sm)]">
              {icon}
            </div>
            <span className="text-sm text-text-secondary">
              Choose an icon that represents this habit
            </span>
          </div>
          <EmojiPicker value={icon} onChange={setIcon} />
          {errors.icon && (
            <p className="text-xs text-error">{errors.icon}</p>
          )}
        </div>
      </Card>

      {/* Color */}
      <Card>
        <div className="space-y-2">
          <p className="hf-kicker">Color</p>
          <Label>Color</Label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </Card>

      {/* Frequency */}
      <Card variant="elevated">
        <div
          className="space-y-2"
          data-error={errors.targetDays || errors.targetCount ? "" : undefined}
        >
          <p className="hf-kicker">Schedule</p>
          <Label>Frequency *</Label>
          <FrequencySelector
            frequency={frequency}
            targetDays={targetDays}
            targetCount={targetCount}
            onFrequencyChange={setFrequency}
            onTargetDaysChange={setTargetDays}
            onTargetCountChange={setTargetCount}
          />
          {errors.targetDays && (
            <p className="text-xs text-error">{errors.targetDays}</p>
          )}
          {errors.targetCount && (
            <p className="text-xs text-error">{errors.targetCount}</p>
          )}
        </div>
      </Card>

      {/* Reminder Time */}
      <Card>
        <div className="space-y-2">
          <p className="hf-kicker">Reminder</p>
          <Label htmlFor="reminderTime">Reminder Time</Label>
          <Input
            id="reminderTime"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />
          <p className="text-xs text-text-muted">Optional</p>
        </div>
      </Card>

      {/* Category */}
      <Card>
        <div className="space-y-2">
          <p className="hf-kicker">Organization</p>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Fitness, Health, Mind"
            maxLength={50}
          />
          <p className="text-xs text-text-muted">Optional — group habits by category</p>
        </div>
      </Card>

      {/* Actions */}
      <div className="hf-panel rounded-2xl flex gap-3 p-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="flex-1 sm:flex-none"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="flex-1 sm:flex-none"
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

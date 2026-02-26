import { z } from "zod/v4";
import { isValid, parseISO } from "date-fns";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Validates that a YYYY-MM-DD string represents a real calendar date. */
const dateString = z
  .string()
  .regex(DATE_REGEX, "Date must be YYYY-MM-DD format")
  .refine(
    (value: string) => isValid(parseISO(value)),
    "Date is not a valid calendar date"
  );

const habitFrequencySchema = z.enum([
  "daily",
  "weekdays",
  "weekends",
  "specific_days",
  "x_per_week",
]);

// Base object schema (without refinements) — used for .omit() / .partial()
const habitBaseSchema = z.object({
  id: z.string().regex(UUID_REGEX, "Invalid UUID format"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(HEX_COLOR_REGEX, "Invalid hex color"),
  frequency: habitFrequencySchema,
  targetDays: z.array(z.number().int().min(0).max(6)).optional(),
  targetCount: z.number().int().min(1).max(7).optional(),
  reminderTime: z.string().regex(TIME_REGEX, "Invalid time format").optional(),
  category: z.string().max(50).optional(),
  sortOrder: z.number().int(),
  isArchived: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Full schema with cross-field refinements
export const habitSchema = habitBaseSchema
  .refine(
    (data) => {
      if (data.frequency === "specific_days") {
        return data.targetDays !== undefined && data.targetDays.length > 0;
      }
      return true;
    },
    { message: "Specific days frequency requires at least one target day" }
  )
  .refine(
    (data) => {
      if (data.frequency === "x_per_week") {
        return data.targetCount !== undefined;
      }
      return true;
    },
    { message: "X per week frequency requires a target count" }
  );

export const habitCompletionSchema = z.object({
  id: z.string().regex(UUID_REGEX, "Invalid UUID format"),
  habitId: z.string().regex(UUID_REGEX, "Invalid habit ID format"),
  date: dateString,
  completedAt: z.iso.datetime(),
  note: z.string().max(250, "Note is too long").optional(),
});

export const userSettingsSchema = z.object({
  id: z.string(),
  theme: z.enum(["light", "dark", "system"]),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  showStreaks: z.boolean(),
  showCompletionRate: z.boolean(),
  defaultView: z.enum(["today", "week", "month"]),
  syncEnabled: z.boolean().optional(),
  lastSyncedAt: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Derive create/update schemas from the base (no refinements)
export const createHabitSchema = habitBaseSchema.omit({
  id: true,
  sortOrder: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
});

export const updateHabitSchema = createHabitSchema.partial();

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

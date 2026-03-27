import { z } from "zod/v4";
import { db } from "@/db/database";
import {
  habitSchema,
  habitCompletionSchema,
  userSettingsSchema,
} from "@/db/schemas";
import type { Habit, HabitCompletion } from "@/types";

// ── Types ────────────────────────────────────────────────────────────

export const EXPORT_VERSION = "1.0";

const exportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.iso.datetime(),
  app: z.literal("HabitFlow"),
  data: z.object({
    habits: z.array(habitSchema),
    completions: z.array(habitCompletionSchema),
    settings: userSettingsSchema,
  }),
});

export type ExportData = z.infer<typeof exportDataSchema>;

export type ImportValidationResult =
  | { valid: true; data: ExportData }
  | { valid: false; errors: string[] };

// ── Export ────────────────────────────────────────────────────────────

export async function buildExportPayload(): Promise<ExportData> {
  const [habits, completions, settingsRows] = await Promise.all([
    db.habits.toArray(),
    db.completions.toArray(),
    db.settings.toArray(),
  ]);

  const settings = settingsRows[0];
  if (!settings) {
    throw new Error("No settings found — cannot export");
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app: "HabitFlow",
    data: { habits, completions, settings },
  };
}

export function downloadJson(data: ExportData, filename?: string): void {
  const name = filename ?? `habitflow-export-${data.exportedAt.split("T")[0]}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── CSV Export ───────────────────────────────────────────────────────

export function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCSVRow(fields: string[]): string {
  return fields.map(escapeCSVField).join(",");
}

const HABIT_CSV_COLUMNS = [
  "id", "name", "description", "icon", "color", "frequency",
  "targetDays", "targetCount", "reminderTime", "category",
  "isArchived", "createdAt", "updatedAt",
] as const;

const COMPLETION_CSV_COLUMNS = [
  "id", "habitId", "habitName", "date", "completedAt", "note",
] as const;

export function buildHabitCSVRow(habit: Habit): string {
  return toCSVRow([
    habit.id,
    habit.name,
    habit.description ?? "",
    habit.icon,
    habit.color,
    habit.frequency,
    habit.targetDays?.join(";") ?? "",
    habit.targetCount?.toString() ?? "",
    habit.reminderTime ?? "",
    habit.category ?? "",
    String(habit.isArchived),
    habit.createdAt,
    habit.updatedAt,
  ]);
}

export function buildCompletionCSVRow(
  completion: HabitCompletion,
  habitNameMap: Map<string, string>
): string {
  return toCSVRow([
    completion.id,
    completion.habitId,
    habitNameMap.get(completion.habitId) ?? "Unknown",
    completion.date,
    completion.completedAt,
    completion.note ?? "",
  ]);
}

export async function exportAsCSV(): Promise<Blob> {
  const { default: JSZip } = await import("jszip");

  const [habits, completions] = await Promise.all([
    db.habits.toArray(),
    db.completions.toArray(),
  ]);

  const habitNameMap = new Map(habits.map((h) => [h.id, h.name]));

  const habitsCSV = [
    toCSVRow([...HABIT_CSV_COLUMNS]),
    ...habits.map(buildHabitCSVRow),
  ].join("\n");

  const completionsCSV = [
    toCSVRow([...COMPLETION_CSV_COLUMNS]),
    ...completions.map((c) => buildCompletionCSVRow(c, habitNameMap)),
  ].join("\n");

  const zip = new JSZip();
  zip.file("habits.csv", habitsCSV);
  zip.file("completions.csv", completionsCSV);

  return zip.generateAsync({ type: "blob" });
}

export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── Import ───────────────────────────────────────────────────────────

const MAX_IMPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function parseImportFile(file: File): Promise<unknown> {
  if (file.size > MAX_IMPORT_SIZE_BYTES) {
    throw new Error("Import file is too large (max 10 MB)");
  }
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON");
  }
}

export function validateImportData(raw: unknown): ImportValidationResult {
  const result = exportDataSchema.safeParse(raw);
  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );
  return { valid: false, errors };
}

export async function applyImport(data: ExportData): Promise<void> {
  await db.transaction(
    "rw",
    [db.habits, db.completions, db.settings],
    async () => {
      await db.habits.clear();
      await db.completions.clear();
      await db.settings.clear();

      await db.habits.bulkPut(data.data.habits);
      await db.completions.bulkPut(data.data.completions);
      await db.settings.put(data.data.settings);
    }
  );
}

// ── Clear ────────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await db.transaction(
    "rw",
    [db.habits, db.completions, db.settings],
    async () => {
      await db.habits.clear();
      await db.completions.clear();
      await db.settings.clear();
    }
  );
}

import { v4 as uuidv4 } from "uuid";
import { z } from "zod/v4";
import { db } from "./database";
import { habitCompletionSchema } from "./schemas";
import { schedulePush } from "@/lib/sync/schedule-push";
import {
  scheduleCompletionPush,
  scheduleCompletionDelete,
} from "@/lib/sync/completion-sync-service";
import { MAX_NOTE_LENGTH } from "@/lib/utils";
import type { HabitCompletion } from "@/types";

export const completionService = {
  async getByHabitId(habitId: string): Promise<HabitCompletion[]> {
    return db.completions.where("habitId").equals(habitId).toArray();
  },

  async getByDate(date: string): Promise<HabitCompletion[]> {
    return db.completions.where("date").equals(date).toArray();
  },

  async getByHabitAndDateRange(
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitCompletion[]> {
    return db.completions
      .where("habitId")
      .equals(habitId)
      .and((c) => c.date >= startDate && c.date <= endDate)
      .toArray();
  },

  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<HabitCompletion[]> {
    return db.completions
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async toggle(
    habitId: string,
    date: string,
    note?: string
  ): Promise<{ completed: boolean; completion?: HabitCompletion }> {
    const existing = await db.completions
      .where("[habitId+date]")
      .equals([habitId, date])
      .first();

    if (existing) {
      await db.completions.delete(existing.id);
      schedulePush();
      scheduleCompletionDelete(habitId, date, existing.id);
      return { completed: false };
    }

    const now = new Date().toISOString();
    const completion: HabitCompletion = {
      id: uuidv4(),
      habitId,
      date,
      completedAt: now,
      note,
    };

    habitCompletionSchema.parse(completion);
    await db.completions.add(completion);
    schedulePush();
    scheduleCompletionPush(completion);
    return { completed: true, completion };
  },

  async addNote(id: string, note: string): Promise<void> {
    z.string().max(MAX_NOTE_LENGTH, "Note is too long").parse(note);
    await db.completions.update(id, { note });
    schedulePush();

    // Re-push the full completion so the note syncs immediately
    const updated = await db.completions.get(id);
    if (updated) scheduleCompletionPush(updated);
  },

  async deleteByHabitId(habitId: string): Promise<number> {
    const count = await db.completions.where("habitId").equals(habitId).delete();
    schedulePush();
    return count;
  },
};

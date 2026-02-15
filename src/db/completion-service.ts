import { v4 as uuidv4 } from "uuid";
import { db } from "./database";
import { habitCompletionSchema } from "./schemas";
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
    return { completed: true, completion };
  },

  async addNote(id: string, note: string): Promise<void> {
    await db.completions.update(id, { note });
  },

  async deleteByHabitId(habitId: string): Promise<number> {
    return db.completions.where("habitId").equals(habitId).delete();
  },
};

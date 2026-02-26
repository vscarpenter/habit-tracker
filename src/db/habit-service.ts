import { v4 as uuidv4 } from "uuid";
import { db } from "./database";
import { habitSchema, createHabitSchema, updateHabitSchema } from "./schemas";
import { schedulePush } from "@/lib/sync/schedule-push";
import type { CreateHabitInput, UpdateHabitInput } from "./schemas";
import type { Habit } from "@/types";

export const habitService = {
  async getAll(): Promise<Habit[]> {
    return db.habits.orderBy("sortOrder").toArray();
  },

  async getActive(): Promise<Habit[]> {
    return db.habits
      .where("isArchived")
      .equals(0)
      .sortBy("sortOrder");
  },

  async getArchived(): Promise<Habit[]> {
    return db.habits
      .where("isArchived")
      .equals(1)
      .sortBy("sortOrder");
  },

  async getById(id: string): Promise<Habit | undefined> {
    return db.habits.get(id);
  },

  async create(input: CreateHabitInput): Promise<Habit> {
    createHabitSchema.parse(input);

    const now = new Date().toISOString();
    const maxOrder = await db.habits.orderBy("sortOrder").last();

    const habit: Habit = {
      ...input,
      id: uuidv4(),
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    habitSchema.parse(habit);
    await db.habits.add(habit);
    schedulePush();
    return habit;
  },

  async update(id: string, input: UpdateHabitInput): Promise<Habit> {
    updateHabitSchema.parse(input);

    const existing = await db.habits.get(id);
    if (!existing) {
      throw new Error(`Habit not found: ${id}`);
    }

    const updated: Habit = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    habitSchema.parse(updated);
    await db.habits.put(updated);
    schedulePush();
    return updated;
  },

  async archive(id: string): Promise<void> {
    const existing = await db.habits.get(id);
    if (!existing) {
      throw new Error(`Habit not found: ${id}`);
    }

    await db.habits.update(id, {
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
    schedulePush();
  },

  async restore(id: string): Promise<void> {
    const existing = await db.habits.get(id);
    if (!existing) {
      throw new Error(`Habit not found: ${id}`);
    }

    await db.habits.update(id, {
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
    schedulePush();
  },

  async delete(id: string): Promise<void> {
    await db.transaction("rw", [db.habits, db.completions], async () => {
      await db.completions.where("habitId").equals(id).delete();
      await db.habits.delete(id);
    });
    schedulePush();
  },

  async reorder(orderedIds: string[]): Promise<void> {
    await db.transaction("rw", db.habits, async () => {
      const updates = orderedIds.map((id, index) =>
        db.habits.update(id, { sortOrder: index })
      );
      await Promise.all(updates);
    });
    schedulePush();
  },

  async getActiveCount(): Promise<number> {
    return db.habits.where("isArchived").equals(0).count();
  },
};

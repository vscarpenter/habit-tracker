import Dexie, { type EntityTable } from "dexie";
import type { Habit, HabitCompletion, UserSettings } from "@/types";

class HabitFlowDB extends Dexie {
  habits!: EntityTable<Habit, "id">;
  completions!: EntityTable<HabitCompletion, "id">;
  settings!: EntityTable<UserSettings, "id">;

  constructor() {
    super("HabitFlowDB");

    this.version(1).stores({
      habits: "id, sortOrder, isArchived, category, createdAt",
      completions: "id, habitId, date, [habitId+date]",
      settings: "id",
    });
  }
}

export const db = new HabitFlowDB();

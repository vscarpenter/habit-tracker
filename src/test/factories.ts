import { v4 as uuidv4 } from "uuid";
import type { Habit, HabitCompletion, UserSettings } from "@/types";

let sortCounter = 0;

export function createHabit(overrides: Partial<Habit> = {}): Habit {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: `Test Habit ${++sortCounter}`,
    icon: "🏃",
    color: "#3b82f6",
    frequency: "daily",
    sortOrder: sortCounter,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createCompletion(
  overrides: Partial<HabitCompletion> = {}
): HabitCompletion {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0];
  return {
    id: uuidv4(),
    habitId: uuidv4(),
    date: today,
    completedAt: now,
    ...overrides,
  };
}

export function createSettings(
  overrides: Partial<UserSettings> = {}
): UserSettings {
  const now = new Date().toISOString();
  return {
    id: "user_settings",
    theme: "system",
    weekStartsOn: 0,
    showStreaks: true,
    showCompletionRate: true,
    defaultView: "today",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Reset the sort counter between tests */
export function resetFactories(): void {
  sortCounter = 0;
}

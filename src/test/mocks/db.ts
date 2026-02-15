import { vi } from "vitest";
import type { Habit, HabitCompletion, UserSettings } from "@/types";

/**
 * In-memory mock for the Dexie database.
 * Each test should call resetMockDb() in beforeEach.
 */
let habits: Habit[] = [];
let completions: HabitCompletion[] = [];
let settings: UserSettings | null = null;

export function resetMockDb(): void {
  habits = [];
  completions = [];
  settings = null;
}

export function seedHabits(data: Habit[]): void {
  habits = [...data];
}

export function seedCompletions(data: HabitCompletion[]): void {
  completions = [...data];
}

export function seedSettings(data: UserSettings): void {
  settings = { ...data };
}

export function getMockHabits(): Habit[] {
  return habits;
}

export function getMockCompletions(): HabitCompletion[] {
  return completions;
}

export function getMockSettings(): UserSettings | null {
  return settings;
}

export const mockHabitService = {
  getAll: vi.fn(async () => [...habits]),
  getActive: vi.fn(async () => habits.filter((h) => !h.isArchived)),
  getArchived: vi.fn(async () => habits.filter((h) => h.isArchived)),
  getById: vi.fn(async (id: string) => habits.find((h) => h.id === id)),
  create: vi.fn(async (input: Partial<Habit>) => {
    const habit = { id: "mock-id", ...input } as Habit;
    habits.push(habit);
    return habit;
  }),
  update: vi.fn(async (id: string, input: Partial<Habit>) => {
    const index = habits.findIndex((h) => h.id === id);
    if (index === -1) throw new Error(`Habit not found: ${id}`);
    habits[index] = { ...habits[index], ...input };
    return habits[index];
  }),
  archive: vi.fn(async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (habit) habit.isArchived = true;
  }),
  restore: vi.fn(async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (habit) habit.isArchived = false;
  }),
  delete: vi.fn(async (id: string) => {
    habits = habits.filter((h) => h.id !== id);
    completions = completions.filter((c) => c.habitId !== id);
  }),
  reorder: vi.fn(async (orderedIds: string[]) => {
    orderedIds.forEach((id, index) => {
      const habit = habits.find((h) => h.id === id);
      if (habit) habit.sortOrder = index;
    });
  }),
  getActiveCount: vi.fn(async () => habits.filter((h) => !h.isArchived).length),
};

export const mockCompletionService = {
  getByHabitId: vi.fn(async (habitId: string) =>
    completions.filter((c) => c.habitId === habitId)
  ),
  getByDate: vi.fn(async (date: string) =>
    completions.filter((c) => c.date === date)
  ),
  getByHabitAndDateRange: vi.fn(
    async (habitId: string, startDate: string, endDate: string) =>
      completions.filter(
        (c) =>
          c.habitId === habitId &&
          c.date >= startDate &&
          c.date <= endDate
      )
  ),
  getByDateRange: vi.fn(async (startDate: string, endDate: string) =>
    completions.filter((c) => c.date >= startDate && c.date <= endDate)
  ),
  toggle: vi.fn(async (habitId: string, date: string) => {
    const existing = completions.find(
      (c) => c.habitId === habitId && c.date === date
    );
    if (existing) {
      completions = completions.filter((c) => c.id !== existing.id);
      return { completed: false };
    }
    const completion: HabitCompletion = {
      id: `mock-${Date.now()}`,
      habitId,
      date,
      completedAt: new Date().toISOString(),
    };
    completions.push(completion);
    return { completed: true, completion };
  }),
  addNote: vi.fn(async (id: string, note: string) => {
    const completion = completions.find((c) => c.id === id);
    if (completion) completion.note = note;
  }),
  deleteByHabitId: vi.fn(async (habitId: string) => {
    const count = completions.filter((c) => c.habitId === habitId).length;
    completions = completions.filter((c) => c.habitId !== habitId);
    return count;
  }),
};

export const mockSettingsService = {
  get: vi.fn(async () =>
    settings ?? {
      id: "user_settings",
      theme: "system" as const,
      weekStartsOn: 0 as const,
      showStreaks: true,
      showCompletionRate: true,
      defaultView: "today" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ),
  update: vi.fn(async (changes: Partial<UserSettings>) => {
    const current = await mockSettingsService.get();
    settings = { ...current, ...changes, updatedAt: new Date().toISOString() };
    return settings;
  }),
  reset: vi.fn(async () => {
    settings = null;
    return mockSettingsService.get();
  }),
};

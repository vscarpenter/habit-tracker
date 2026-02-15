export type HabitFrequency =
  | "daily"
  | "weekdays"
  | "weekends"
  | "specific_days"
  | "x_per_week";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  targetDays?: number[];
  targetCount?: number;
  reminderTime?: string;
  category?: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  completedAt: string;
  note?: string;
}

export interface UserSettings {
  id: string;
  theme: "light" | "dark" | "system";
  weekStartsOn: 0 | 1;
  showStreaks: boolean;
  showCompletionRate: boolean;
  defaultView: "today" | "week" | "month";
  createdAt: string;
  updatedAt: string;
}

export type Theme = UserSettings["theme"];
export type WeekStartDay = UserSettings["weekStartsOn"];

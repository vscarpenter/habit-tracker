export type HabitFrequency =
  | "daily"
  | "weekdays"
  | "weekends"
  | "specific_days"
  | "x_per_week";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export type HabitType = "binary" | "quantitative";

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
  timeOfDay?: TimeOfDay;
  habitType?: HabitType;
  targetValue?: number | null;
  unit?: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EffortRating = 1 | 2 | 3 | 4 | 5;

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  completedAt: string;
  note?: string;
  effort?: EffortRating | null;
  value?: number | null;
}

export interface UserSettings {
  id: string;
  theme: "light" | "dark" | "system";
  weekStartsOn: 0 | 1;
  showStreaks: boolean;
  showCompletionRate: boolean;
  defaultView: "today" | "week" | "month";
  syncEnabled?: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Theme = UserSettings["theme"];
export type WeekStartDay = UserSettings["weekStartsOn"];

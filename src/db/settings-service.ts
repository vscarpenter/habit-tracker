import { db } from "./database";
import { userSettingsSchema } from "./schemas";
import { schedulePush } from "@/lib/sync/schedule-push";
import type { UserSettings } from "@/types";

const DEFAULT_SETTINGS_ID = "user_settings";

const DEFAULT_SETTINGS: UserSettings = {
  id: DEFAULT_SETTINGS_ID,
  theme: "system",
  weekStartsOn: 0,
  showStreaks: true,
  showCompletionRate: true,
  defaultView: "today",
  syncEnabled: false,
  lastSyncedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const settingsService = {
  async get(): Promise<UserSettings> {
    const settings = await db.settings.get(DEFAULT_SETTINGS_ID);
    if (settings) return settings;

    // First-time use: create default settings
    const now = new Date().toISOString();
    const defaults: UserSettings = {
      ...DEFAULT_SETTINGS,
      createdAt: now,
      updatedAt: now,
    };

    userSettingsSchema.parse(defaults);
    await db.settings.add(defaults);
    return defaults;
  },

  async update(
    changes: Partial<Omit<UserSettings, "id" | "createdAt" | "updatedAt">>
  ): Promise<UserSettings> {
    const existing = await this.get();

    const updated: UserSettings = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    userSettingsSchema.parse(updated);
    await db.settings.put(updated);
    schedulePush();
    return updated;
  },

  async reset(): Promise<UserSettings> {
    const now = new Date().toISOString();
    const defaults: UserSettings = {
      ...DEFAULT_SETTINGS,
      createdAt: now,
      updatedAt: now,
    };

    userSettingsSchema.parse(defaults);
    await db.settings.put(defaults);
    schedulePush();
    return defaults;
  },
};

import { v4 as uuidv4 } from "uuid";
import { db } from "./database";
import { habitChainSchema } from "./schemas";
import { schedulePush } from "@/lib/sync/schedule-push";
import type { HabitChain } from "@/types";

export const chainService = {
  async getAll(): Promise<HabitChain[]> {
    return db.habitChains.toArray();
  },

  async getById(id: string): Promise<HabitChain | undefined> {
    return db.habitChains.get(id);
  },

  async create(name: string, habitIds: string[]): Promise<HabitChain> {
    const chain: HabitChain = {
      id: uuidv4(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    habitChainSchema.parse(chain);

    await db.transaction("rw", [db.habitChains, db.habits], async () => {
      await db.habitChains.add(chain);

      for (let i = 0; i < habitIds.length; i++) {
        await db.habits.update(habitIds[i], {
          chainId: chain.id,
          chainOrder: i,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    schedulePush();
    return chain;
  },

  async addHabit(chainId: string, habitId: string): Promise<void> {
    const chainHabits = await db.habits
      .where("chainId")
      .equals(chainId)
      .toArray();

    const maxOrder = chainHabits.reduce(
      (max, h) => Math.max(max, h.chainOrder ?? 0),
      -1
    );

    await db.habits.update(habitId, {
      chainId,
      chainOrder: maxOrder + 1,
      updatedAt: new Date().toISOString(),
    });

    schedulePush();
  },

  async removeHabit(habitId: string): Promise<void> {
    await db.habits.update(habitId, {
      chainId: null,
      chainOrder: null,
      updatedAt: new Date().toISOString(),
    });

    schedulePush();
  },

  async reorder(chainId: string, habitIds: string[]): Promise<void> {
    await db.transaction("rw", db.habits, async () => {
      const now = new Date().toISOString();
      for (let i = 0; i < habitIds.length; i++) {
        await db.habits.update(habitIds[i], {
          chainId,
          chainOrder: i,
          updatedAt: now,
        });
      }
    });

    schedulePush();
  },

  async delete(chainId: string): Promise<void> {
    await db.transaction("rw", [db.habitChains, db.habits], async () => {
      // Unlink all habits from this chain
      const chainHabits = await db.habits
        .where("chainId")
        .equals(chainId)
        .toArray();

      const now = new Date().toISOString();
      for (const habit of chainHabits) {
        await db.habits.update(habit.id, {
          chainId: null,
          chainOrder: null,
          updatedAt: now,
        });
      }

      await db.habitChains.delete(chainId);
    });

    schedulePush();
  },

  async update(chainId: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 60) {
      throw new Error("Chain name must be 1-60 characters");
    }
    await db.habitChains.update(chainId, { name: trimmed });
    schedulePush();
  },
};

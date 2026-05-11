import { db } from "./database";
import type { HabitChain } from "@/types";

export const chainService = {
  async getAll(): Promise<HabitChain[]> {
    return db.habitChains.toArray();
  },
};

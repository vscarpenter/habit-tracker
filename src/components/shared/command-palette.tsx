"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Habit } from "@/types";

const MAX_RESULTS = 10;

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
}

export function CommandPalette({
  open,
  onOpenChange,
  habits,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return habits.slice(0, MAX_RESULTS);
    const lower = query.toLowerCase();
    return habits
      .filter((h) => h.name.toLowerCase().includes(lower))
      .slice(0, MAX_RESULTS);
  }, [habits, query]);

  function handleSelect(habit: Habit) {
    onOpenChange(false);
    setQuery("");
    router.push(`/habits/${habit.id}`);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search habits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {filtered.length > 0 ? (
          <ul className="mt-3 max-h-64 overflow-y-auto space-y-1">
            {filtered.map((habit) => (
              <li key={habit.id}>
                <button
                  className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface transition-colors"
                  onClick={() => handleSelect(habit)}
                >
                  <span className="text-lg leading-none">{habit.icon}</span>
                  <span className="text-text-primary font-medium truncate">
                    {habit.name}
                  </span>
                  {habit.category && (
                    <span className="ml-auto text-xs text-text-muted">
                      {habit.category}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-muted text-center py-4">
            No habits found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

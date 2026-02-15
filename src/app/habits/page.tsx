"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HabitListItem } from "@/components/habits/habit-list-item";
import { CategoryFilter } from "@/components/habits/category-filter";
import { NoHabitsEmpty } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from "@/hooks/use-habits";
import { useToast } from "@/components/shared/toast";
import { Plus, Search } from "lucide-react";

export default function HabitsPage() {
  const {
    activeHabits,
    archivedHabits,
    loading,
    archive,
    restore,
    remove,
    reorder,
  } = useHabits();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeHabits.forEach((h) => {
      if (h.category) cats.add(h.category);
    });
    return Array.from(cats).sort();
  }, [activeHabits]);

  const filteredHabits = useMemo(() => {
    let filtered = activeHabits;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((h) => h.name.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      filtered = filtered.filter((h) => h.category === categoryFilter);
    }
    return filtered;
  }, [activeHabits, search, categoryFilter]);

  const handleArchive = async (id: string) => {
    await archive(id);
    toast("Habit archived.", "success");
  };

  const handleRestore = async (id: string) => {
    await restore(id);
    toast("Habit restored!", "success");
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast("Habit permanently deleted.", "success");
  };

  const handleMoveUp = async (id: string) => {
    const idx = activeHabits.findIndex((h) => h.id === id);
    if (idx <= 0) return;
    const ids = activeHabits.map((h) => h.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    await reorder(ids);
  };

  const handleMoveDown = async (id: string) => {
    const idx = activeHabits.findIndex((h) => h.id === id);
    if (idx < 0 || idx >= activeHabits.length - 1) return;
    const ids = activeHabits.map((h) => h.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    await reorder(ids);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header
        title="Habits"
        subtitle={`${activeHabits.length} active habit${activeHabits.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/habits/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </Link>
        }
      />

      {activeHabits.length === 0 && archivedHabits.length === 0 ? (
        <NoHabitsEmpty />
      ) : (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search habits..."
                className="pl-9"
              />
            </div>
            <CategoryFilter
              categories={categories}
              selected={categoryFilter}
              onSelect={setCategoryFilter}
            />
          </div>

          {/* Active Habits */}
          <div className="space-y-2">
            {filteredHabits.map((habit, idx) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDelete={handleDelete}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={idx === 0}
                isLast={idx === filteredHabits.length - 1}
              />
            ))}

            {filteredHabits.length === 0 && activeHabits.length > 0 && (
              <p className="text-sm text-text-muted text-center py-8">
                No habits match your search.
              </p>
            )}
          </div>

          {/* Archived Section */}
          {archivedHabits.length > 0 && (
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className="text-sm font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                {showArchived ? "Hide" : "Show"} archived ({archivedHabits.length})
              </button>

              {showArchived && (
                <div className="space-y-2 mt-3">
                  {archivedHabits.map((habit) => (
                    <HabitListItem
                      key={habit.id}
                      habit={habit}
                      onArchive={handleArchive}
                      onRestore={handleRestore}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

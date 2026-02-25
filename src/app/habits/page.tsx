"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HabitListItem } from "@/components/habits/habit-list-item";
import { CategoryFilter } from "@/components/habits/category-filter";
import { Badge } from "@/components/ui/badge";
import { NoHabitsEmpty } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from "@/hooks/use-habits";
import { useToday } from "@/hooks/use-today";
import { useStreaks } from "@/hooks/use-streaks";
import { useToast } from "@/components/shared/toast";
import { DB_ERROR_MSG } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { Plus, Search, Flame, Layers3, FolderKanban } from "lucide-react";

export default function HabitsPage() {
  const today = useToday();
  const {
    activeHabits,
    archivedHabits,
    loading,
    archive,
    restore,
    remove,
    reorder,
  } = useHabits();
  const { streakMap } = useStreaks(activeHabits, today);
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
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((h) => h.name.toLowerCase().includes(searchLower));
    }
    if (categoryFilter) {
      filtered = filtered.filter((h) => h.category === categoryFilter);
    }
    return filtered;
  }, [activeHabits, search, categoryFilter]);

  const streakingCount = useMemo(
    () =>
      activeHabits.filter((habit) => (streakMap.get(habit.id) ?? 0) >= 3).length,
    [activeHabits, streakMap]
  );

  const handleArchive = async (id: string) => {
    try {
      await archive(id);
      toast("Habit archived.", "success");
    } catch (error) {
      logger.error("Failed to archive habit:", error);
      toast(DB_ERROR_MSG, "error");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restore(id);
      toast("Habit restored!", "success");
    } catch (error) {
      logger.error("Failed to restore habit:", error);
      toast(DB_ERROR_MSG, "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast("Habit permanently deleted.", "success");
    } catch (error) {
      logger.error("Failed to delete habit:", error);
      toast(DB_ERROR_MSG, "error");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = activeHabits.findIndex((h) => h.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= activeHabits.length) return;
    const ids = activeHabits.map((h) => h.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    try {
      await reorder(ids);
    } catch (error) {
      logger.error("Failed to reorder habits:", error);
      toast(DB_ERROR_MSG, "error");
    }
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
        eyebrow="Habit Library"
        accentColor="var(--accent-emerald)"
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={Layers3}
              label="Active Habits"
              value={activeHabits.length}
              helper="Currently tracking"
              accent="var(--chart-2)"
            />
            <SummaryCard
              icon={FolderKanban}
              label="Categories"
              value={categories.length}
              helper={categories.length === 0 ? "No categories yet" : "Organized habits"}
              accent="var(--chart-1)"
            />
            <SummaryCard
              icon={Flame}
              label="Hot Streaks"
              value={streakingCount}
              helper="3+ day streaks"
              accent="var(--chart-4)"
            />
          </div>

          {/* Search & Filter */}
          <div className="hf-panel rounded-3xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <Badge className="text-[11px]">Filters</Badge>
              <span className="text-xs text-text-muted">Narrow down your habit list</span>
            </div>
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
          </div>

          {/* Active Habits */}
          <div className="hf-panel-strong rounded-3xl p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-border-subtle/70 bg-surface-overlay/60 px-3 py-2">
              <div>
                <p className="hf-kicker">Library</p>
                <h2 className="text-sm font-semibold text-text-primary">Active Habits</h2>
              </div>
              <span className="rounded-full border border-border-subtle/80 bg-surface-paper/70 px-2.5 py-1 text-xs text-text-muted">
                {filteredHabits.length} shown
              </span>
            </div>
            <div className="space-y-2">
              {filteredHabits.map((habit, idx) => (
                <HabitListItem
                  key={habit.id}
                  habit={habit}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  onMoveUp={(id) => handleReorder(id, "up")}
                  onMoveDown={(id) => handleReorder(id, "down")}
                  isFirst={idx === 0}
                  isLast={idx === filteredHabits.length - 1}
                  streak={streakMap.get(habit.id) ?? 0}
                />
              ))}

              {filteredHabits.length === 0 && activeHabits.length > 0 && (
                <p className="text-sm text-text-muted text-center py-8">
                  No habits match your search.
                </p>
              )}
            </div>
          </div>

          {/* Archived Section */}
          {archivedHabits.length > 0 && (
            <div className="hf-panel-muted rounded-2xl p-4">
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className="rounded-full border border-transparent px-2 py-1 text-sm font-medium text-text-muted transition-colors hover:border-border-subtle hover:bg-surface-paper/50 hover:text-text-secondary"
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
                      streak={streakMap.get(habit.id) ?? 0}
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

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number;
  helper: string;
  accent: string;
}

function SummaryCard({ icon: Icon, label, value, helper, accent }: SummaryCardProps) {
  return (
    <div className="hf-panel-strong rounded-2xl p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-text-secondary">{label}</p>
        <div className="rounded-lg border border-border-subtle/80 bg-surface-tint/70 p-1.5">
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{helper}</p>
    </div>
  );
}

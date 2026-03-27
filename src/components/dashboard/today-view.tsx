"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, Flame, TrendingUp, Target, Zap } from "lucide-react";
import { CompactProgressBar } from "./compact-progress-bar";
import { CompletionToggle } from "@/components/habits/completion-toggle";
import { NoHabitsEmpty, AllCompleteMessage } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  MotionPage,
  MotionCard,
  MotionListItem,
  staggerContainer,
  fadeUpItem,
  cardInteraction,
  springGentle,
} from "@/components/shared/motion";
import { isHabitScheduledForDate } from "@/lib/date-utils";
import { useDashboardStats } from "@/hooks/use-habit-stats";
import type { Habit, HabitCompletion } from "@/types";

interface TodayViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  today: string;
  loading: boolean;
  onToggle: (habitId: string) => void;
  isCompleted: (habitId: string) => boolean;
  showStreaks?: boolean;
  streakMap?: Map<string, number>;
}

export function TodayView({
  habits,
  completions,
  today,
  loading,
  onToggle,
  isCompleted,
  showStreaks = false,
  streakMap,
}: TodayViewProps) {
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.isArchived),
    [habits]
  );

  const scheduledHabits = useMemo(
    () =>
      activeHabits
        .filter((h) => isHabitScheduledForDate(h, today))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [activeHabits, today]
  );

  const { scheduledCount, completedCount, allComplete } =
    useDashboardStats(activeHabits, completions, today);
  const remainingCount = Math.max(scheduledCount - completedCount, 0);
  const completionRate = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

  const focusCategories = useMemo(() => {
    const categories = scheduledHabits
      .map((habit) => habit.category)
      .filter((category): category is string => Boolean(category));
    return Array.from(new Set(categories)).slice(0, 3);
  }, [scheduledHabits]);

  const streakingCount = useMemo(
    () =>
      scheduledHabits.filter(
        (habit) => (streakMap?.get(habit.id) ?? 0) >= MIN_STREAK_DISPLAY
      ).length,
    [scheduledHabits, streakMap]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return <NoHabitsEmpty />;
  }

  return (
    <MotionPage className="space-y-5">
      {/* ── Bento Grid: Stats Row ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        <BentoStat
          icon={<Target className="h-4 w-4" />}
          label="Scheduled"
          value={scheduledCount}
          accent="var(--accent-blue)"
        />
        <BentoStat
          icon={<Zap className="h-4 w-4" />}
          label="Completed"
          value={completedCount}
          accent="var(--accent-emerald)"
        />
        <BentoStat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Completion"
          value={`${completionRate}%`}
          accent="var(--accent-violet)"
        />
        <BentoStat
          icon={<Flame className="h-4 w-4" />}
          label="Streaking"
          value={showStreaks ? streakingCount : "—"}
          accent="var(--accent-amber)"
        />
      </motion.div>

      {/* ── Progress Hero Card ── */}
      <MotionCard className="overflow-hidden p-5 sm:p-6" interactive={false}>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="hf-kicker">Today&apos;s Momentum</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              {completedCount} of {scheduledCount} habits complete
            </h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              {remainingCount === 0
                ? "All scheduled habits are done. Keep this rhythm going."
                : `${remainingCount} left today. Small steps compound quickly.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant="accent" className="px-3 py-1 text-[11px]">
              {completionRate}% completion
            </Badge>
            {showStreaks && streakingCount > 0 && (
              <Badge className="px-3 py-1 text-[11px]">
                {streakingCount} streaking
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle/75 bg-surface-overlay/70 p-3 sm:p-4">
          <CompactProgressBar completed={completedCount} total={scheduledCount} />

          {focusCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-muted">Focus areas:</span>
              {focusCategories.map((category) => (
                <Badge key={category} className="text-[11px]">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </MotionCard>

      {/* ── Checklist ── */}
      {scheduledHabits.length > 0 ? (
        <MotionCard className="overflow-hidden" interactive={false}>
          <div className="flex items-center justify-between border-b border-border-subtle/70 bg-surface-paper/40 px-5 py-3.5">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-text-primary">Today&apos;s Checklist</h3>
              <p className="text-xs font-medium text-text-muted">
                {scheduledHabits.length} scheduled habit{scheduledHabits.length !== 1 ? "s" : ""}
              </p>
            </div>
            <motion.div {...cardInteraction}>
              <Link
                href="/habits"
                className="inline-flex items-center gap-1 rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-subtle hover:bg-surface-paper/70 hover:text-text-primary"
              >
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {scheduledHabits.map((habit, idx) => {
              const completed = isCompleted(habit.id);
              const streak = streakMap?.get(habit.id) ?? 0;
              const isLast = idx === scheduledHabits.length - 1;

              return (
                <MotionListItem key={habit.id}>
                  <ChecklistRow
                    habit={habit}
                    completed={completed}
                    streak={showStreaks ? streak : 0}
                    onToggle={() => onToggle(habit.id)}
                    isLast={isLast}
                  />
                </MotionListItem>
              );
            })}
          </motion.ul>
        </MotionCard>
      ) : (
        <MotionCard className="px-4 py-8 text-center text-sm text-text-muted">
          No habits scheduled for today.
        </MotionCard>
      )}

      {/* All Complete Message */}
      {allComplete && (
        <MotionListItem>
          <AllCompleteMessage />
        </MotionListItem>
      )}
    </MotionPage>
  );
}

/* ─── Bento Stat Card ─── */

interface BentoStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}

function BentoStat({ icon, label, value, accent }: BentoStatProps) {
  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={{ y: -4, transition: springGentle }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/60 p-4",
        "bg-white/70 backdrop-blur-xl",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "dark:border-slate-700/40 dark:bg-slate-900/70",
        "transition-shadow duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]",
        "cursor-default"
      )}
    >
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: accent }}
      />

      <div
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight text-text-primary">{value}</p>
      <p className="text-xs font-medium text-text-muted">{label}</p>
    </motion.div>
  );
}

/* ─── Checklist Row ─── */

interface ChecklistRowProps {
  habit: Habit;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  isLast: boolean;
}

const MIN_STREAK_DISPLAY = 2;

function ChecklistRow({ habit, completed, streak, onToggle, isLast }: ChecklistRowProps) {
  return (
    <motion.div
      whileHover={{ backgroundColor: "var(--surface-paper)", x: 2 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className={cn(
        "group relative flex items-center gap-3 px-5 py-3.5",
        "transition-colors duration-150",
        !isLast && "border-b border-border-subtle/50"
      )}
    >
      <span
        aria-hidden
        className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full opacity-80"
        style={{ backgroundColor: habit.color, opacity: completed ? 0.35 : 0.8 }}
      />
      <CompletionToggle
        completed={completed}
        color={habit.color}
        onToggle={onToggle}
        size="sm"
      />

      <Link
        href={`/habits/${habit.id}`}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg pr-1"
      >
        <span className="text-base shrink-0">{habit.icon}</span>
        <span
          className={cn(
            "text-sm font-medium truncate transition-all duration-200",
            completed
              ? "text-text-muted line-through"
              : "text-text-primary"
          )}
        >
          {habit.name}
        </span>
        {habit.category && (
          <Badge className="hidden md:inline-flex text-[11px]">
            {habit.category}
          </Badge>
        )}
      </Link>

      {streak >= MIN_STREAK_DISPLAY && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-accent-amber shrink-0"
        >
          <Flame className="h-3.5 w-3.5 animate-flame-flicker" />
          <span>{streak}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

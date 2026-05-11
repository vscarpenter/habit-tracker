"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Link2 } from "lucide-react";
import { CompletionToggle } from "@/components/habits/completion-toggle";
import { EffortPicker } from "@/components/habits/effort-picker";
import { ValueInput } from "@/components/habits/value-input";
import { AllCompleteMessage } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  MotionCard,
  MotionListItem,
  cardInteraction,
  staggerContainer,
} from "@/components/shared/motion";
import { cn } from "@/lib/utils";
import type { Habit, HabitChain, EffortRating, TimeOfDay } from "@/types";
import { TimeGroupHeader } from "./today-time-group-header";

const MIN_STREAK_DISPLAY = 2;

type HabitItem =
  | { type: "single"; habit: Habit }
  | { type: "chain"; chain: HabitChain; habits: Habit[] };

type TimeGroup = { key: TimeOfDay; items: HabitItem[] };

interface TodayChecklistProps {
  scheduledHabits: Habit[];
  chains: HabitChain[];
  allComplete: boolean;
  showStreaks: boolean;
  streakMap?: Map<string, number>;
  onToggle: (habitId: string) => void;
  onEffort?: (completionId: string, effort: EffortRating | null) => void;
  onValueChange?: (habitId: string, value: number) => void;
  isCompleted: (habitId: string) => boolean;
  getCompletionId?: (habitId: string) => string | undefined;
  getCompletionValue?: (habitId: string) => number;
}

interface ChecklistRowProps {
  habit: Habit;
  completed: boolean;
  streak: number;
  onToggle?: () => void;
  isLast: boolean;
  valueInput?: React.ReactNode;
}

function buildTimeGroups(
  scheduledHabits: Habit[],
  chains: HabitChain[]
): TimeGroup[] {
  const groups: TimeGroup[] = [
    { key: "morning", items: [] },
    { key: "afternoon", items: [] },
    { key: "evening", items: [] },
    { key: "anytime", items: [] },
  ];
  const groupMap = new Map(groups.map((group) => [group.key, group]));
  const chainMap = new Map(chains.map((chain) => [chain.id, chain]));
  const addedChains = new Set<string>();

  for (const habit of scheduledHabits) {
    const group = groupMap.get(habit.timeOfDay ?? "anytime") ?? groupMap.get("anytime");
    if (!group) continue;

    if (!habit.chainId) {
      group.items.push({ type: "single", habit });
      continue;
    }

    if (addedChains.has(habit.chainId)) continue;
    addedChains.add(habit.chainId);

    const chain = chainMap.get(habit.chainId);
    if (!chain) {
      group.items.push({ type: "single", habit });
      continue;
    }

    const chainHabits = scheduledHabits
      .filter((scheduledHabit) => scheduledHabit.chainId === habit.chainId)
      .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));

    group.items.push({ type: "chain", chain, habits: chainHabits });
  }

  return groups.filter((group) => group.items.length > 0);
}

function ChecklistRow({
  habit,
  completed,
  streak,
  onToggle,
  isLast,
  valueInput,
}: ChecklistRowProps) {
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
      {onToggle ? (
        <CompletionToggle
          completed={completed}
          color={habit.color}
          onToggle={onToggle}
          size="sm"
        />
      ) : (
        <span className="shrink-0 text-lg">{habit.icon}</span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/habits/${habit.id}`}
          className="flex items-center gap-2 rounded-lg pr-1"
        >
          {onToggle && <span className="shrink-0 text-base">{habit.icon}</span>}
          <span
            className={cn(
              "truncate text-sm font-medium transition-colors duration-200",
              completed ? "text-text-muted line-through" : "text-text-primary"
            )}
          >
            {habit.name}
          </span>
          {habit.category && (
            <Badge className="hidden text-[11px] md:inline-flex">
              {habit.category}
            </Badge>
          )}
        </Link>
        {valueInput}
      </div>

      {streak >= MIN_STREAK_DISPLAY && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-accent-amber"
        >
          <Flame className="h-3.5 w-3.5 animate-flame-flicker" />
          <span>{streak}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function TodayChecklist({
  scheduledHabits,
  chains,
  allComplete,
  showStreaks,
  streakMap,
  onToggle,
  onEffort,
  onValueChange,
  isCompleted,
  getCompletionId,
  getCompletionValue,
}: TodayChecklistProps) {
  const [effortPickerHabitId, setEffortPickerHabitId] = useState<string | null>(null);

  const timeGroups = useMemo(
    () => buildTimeGroups(scheduledHabits, chains),
    [chains, scheduledHabits]
  );

  const handleToggle = useCallback(
    (habitId: string) => {
      const wasCompleted = isCompleted(habitId);
      onToggle(habitId);

      if (!wasCompleted && onEffort) {
        setEffortPickerHabitId(habitId);
        return;
      }

      setEffortPickerHabitId(null);
    },
    [isCompleted, onEffort, onToggle]
  );

  const handleEffort = useCallback(
    (effort: EffortRating | null) => {
      if (!effortPickerHabitId || !onEffort || effort === null) {
        setEffortPickerHabitId(null);
        return;
      }

      const completionId = getCompletionId?.(effortPickerHabitId);
      if (completionId) {
        onEffort(completionId, effort);
      }

      setEffortPickerHabitId(null);
    },
    [effortPickerHabitId, getCompletionId, onEffort]
  );

  return (
    <>
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
            {timeGroups.map((group, groupIndex) => {
              const groupHabits = group.items.flatMap((item) =>
                item.type === "chain" ? item.habits : [item.habit]
              );
              const groupCompleted = groupHabits.filter((habit) => isCompleted(habit.id)).length;
              const isLastGroup = groupIndex === timeGroups.length - 1;

              return (
                <li key={group.key}>
                  {!(timeGroups.length === 1 && group.key === "anytime") && (
                    <TimeGroupHeader
                      timeOfDay={group.key}
                      completed={groupCompleted}
                      total={groupHabits.length}
                      isFirst={groupIndex === 0}
                    />
                  )}
                  <ul>
                    {group.items.map((item, itemIndex) => {
                      const isLastItem = itemIndex === group.items.length - 1 && isLastGroup;

                      if (item.type === "chain") {
                        const chainCompletedCount = item.habits.filter((habit) => isCompleted(habit.id)).length;

                        return (
                          <li key={item.chain.id}>
                            <div className="border-b border-border-subtle/40 bg-surface-paper/30 px-5 py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Link2 className="h-3.5 w-3.5 text-text-muted" />
                                  <span className="text-xs font-semibold text-text-secondary">
                                    {item.chain.name}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-text-muted">
                                  {chainCompletedCount}/{item.habits.length}
                                </span>
                              </div>
                            </div>
                            <ul
                              className="ml-7 border-l-2"
                              style={{ borderColor: item.habits[0]?.color ?? "var(--border-subtle)" }}
                            >
                              {item.habits.map((habit, habitIndex) => {
                                const isQuantitative = habit.habitType === "quantitative";
                                const completed = isQuantitative
                                  ? (getCompletionValue?.(habit.id) ?? 0) >= (habit.targetValue ?? 1)
                                  : isCompleted(habit.id);
                                const streak = streakMap?.get(habit.id) ?? 0;
                                const isLastInChain = habitIndex === item.habits.length - 1;

                                return (
                                  <MotionListItem key={habit.id}>
                                    <ChecklistRow
                                      habit={habit}
                                      completed={completed}
                                      streak={showStreaks ? streak : 0}
                                      onToggle={isQuantitative ? undefined : () => handleToggle(habit.id)}
                                      isLast={isLastInChain && isLastItem}
                                      valueInput={isQuantitative && onValueChange ? (
                                        <ValueInput
                                          habit={habit}
                                          currentValue={getCompletionValue?.(habit.id) ?? 0}
                                          onValueChange={(value) => onValueChange(habit.id, value)}
                                        />
                                      ) : undefined}
                                    />
                                    {!isQuantitative && (
                                      <EffortPicker
                                        visible={effortPickerHabitId === habit.id}
                                        onSelect={handleEffort}
                                      />
                                    )}
                                  </MotionListItem>
                                );
                              })}
                            </ul>
                          </li>
                        );
                      }

                      const habit = item.habit;
                      const isQuantitative = habit.habitType === "quantitative";
                      const completed = isQuantitative
                        ? (getCompletionValue?.(habit.id) ?? 0) >= (habit.targetValue ?? 1)
                        : isCompleted(habit.id);
                      const streak = streakMap?.get(habit.id) ?? 0;

                      return (
                        <MotionListItem key={habit.id}>
                          <ChecklistRow
                            habit={habit}
                            completed={completed}
                            streak={showStreaks ? streak : 0}
                            onToggle={isQuantitative ? undefined : () => handleToggle(habit.id)}
                            isLast={isLastItem && effortPickerHabitId !== habit.id}
                            valueInput={isQuantitative && onValueChange ? (
                              <ValueInput
                                habit={habit}
                                currentValue={getCompletionValue?.(habit.id) ?? 0}
                                onValueChange={(value) => onValueChange(habit.id, value)}
                              />
                            ) : undefined}
                          />
                          {!isQuantitative && (
                            <EffortPicker
                              visible={effortPickerHabitId === habit.id}
                              onSelect={handleEffort}
                            />
                          )}
                        </MotionListItem>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </motion.ul>
        </MotionCard>
      ) : (
        <MotionCard className="px-4 py-8 text-center text-sm text-text-muted">
          No habits scheduled for today.
        </MotionCard>
      )}

      {allComplete && (
        <MotionListItem>
          <AllCompleteMessage />
        </MotionListItem>
      )}
    </>
  );
}

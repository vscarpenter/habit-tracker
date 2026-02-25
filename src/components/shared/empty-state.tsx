"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, CalendarCheck } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "hf-panel-strong mx-auto flex w-full max-w-3xl flex-col items-center justify-center rounded-3xl px-4 py-10 text-center sm:py-16",
        className
      )}
    >
      {Icon && (
        <div className="mb-5 rounded-2xl border border-border-subtle bg-surface-tint/80 p-3 shadow-[var(--shadow-editorial-sm)] sm:mb-6 sm:p-4">
          <Icon className="h-8 w-8 text-text-muted sm:h-10 sm:w-10" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mb-5 max-w-xs text-sm text-text-secondary sm:mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function NoHabitsEmpty() {
  return (
    <EmptyState
      icon={CalendarCheck}
      title="Start building better habits"
      description="Create your first habit and start tracking your progress toward a better routine."
      actionLabel="Create Your First Habit"
      actionHref="/habits/new"
    />
  );
}

export function NoStatsEmpty() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No data yet"
      description="Complete some habits to see your statistics and progress here."
    />
  );
}

export function AllCompleteMessage() {
  return (
    <div className="hf-panel-strong animate-fade-in rounded-3xl py-8 text-center">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        All done for today!
      </h3>
      <p className="text-sm text-text-secondary">
        Great job staying consistent. See you tomorrow!
      </p>
    </div>
  );
}

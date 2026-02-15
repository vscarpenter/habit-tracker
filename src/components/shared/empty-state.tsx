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
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      {Icon && (
        <div className="mb-6 rounded-2xl bg-surface p-4 border border-border-subtle">
          <Icon className="h-10 w-10 text-text-muted" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-xs mb-6">{description}</p>
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
    <div className="text-center py-8 animate-fade-in">
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

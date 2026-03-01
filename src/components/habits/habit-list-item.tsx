"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoreVertical, Edit, Archive, ArchiveRestore, Trash2, ArrowUp, ArrowDown, Flame } from "lucide-react";
import { frequencyLabel } from "@/lib/date-utils";
import type { Habit } from "@/types";

interface HabitListItemProps {
  habit: Habit;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  streak?: number;
}

export function HabitListItem({
  habit,
  onArchive,
  onRestore,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  streak = 0,
}: HabitListItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showStreak = streak >= 2 && !habit.isArchived;

  return (
    <>
      <div
        className={cn(
          "hf-row group relative rounded-2xl px-4 py-3",
          "transition-all duration-200 hover:-translate-y-0.5",
          menuOpen && "z-10"
        )}
      >
        <span
          aria-hidden
          className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full opacity-85"
          style={{ backgroundColor: habit.color }}
        />

        <div className="flex items-center gap-3 pl-1">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-paper text-xl shadow-[var(--shadow-editorial-sm)]"
            style={{ boxShadow: `inset 0 0 0 1px ${habit.color}20, var(--shadow-editorial-sm)` }}
          >
            {habit.icon}
          </div>

          <Link
            href={`/habits/${habit.id}`}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-2">
              <div className="font-medium text-sm text-text-primary truncate">
                {habit.name}
              </div>
              {habit.category && (
                <Badge className="hidden sm:inline-flex text-[11px]">{habit.category}</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              {frequencyLabel(habit)}
              {showStreak && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 font-medium text-accent-amber">
                  <Flame className="h-3.5 w-3.5" />
                  {streak} day streak
                </span>
              )}
              {habit.isArchived && <Badge variant="warning">Archived</Badge>}
            </div>
          </Link>

          <DropdownMenu onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              className="rounded-xl border border-transparent p-2 text-text-muted transition-colors hover:border-border-subtle hover:bg-surface-paper/70 hover:text-text-primary"
              aria-label="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href={`/habits/${habit.id}/edit`} className="flex items-center gap-2 w-full">
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>

              {!habit.isArchived && onMoveUp && !isFirst && (
                <DropdownMenuItem onClick={() => onMoveUp(habit.id)}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Move up
                </DropdownMenuItem>
              )}
              {!habit.isArchived && onMoveDown && !isLast && (
                <DropdownMenuItem onClick={() => onMoveDown(habit.id)}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Move down
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {habit.isArchived ? (
                <DropdownMenuItem onClick={() => onRestore(habit.id)}>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onArchive(habit.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                destructive
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Permanently delete "${habit.name}"?`}
        description="This will remove all completion history. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => onDelete(habit.id)}
      />
    </>
  );
}

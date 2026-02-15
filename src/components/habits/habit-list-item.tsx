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
import { MoreVertical, Edit, Archive, ArchiveRestore, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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
}: HabitListItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl",
          "bg-surface backdrop-blur-xl border border-border",
          "transition-colors duration-150 hover:bg-surface-elevated"
        )}
      >
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${habit.color}15` }}
        >
          {habit.icon}
        </div>

        <Link
          href={`/habits/${habit.id}`}
          className="flex-1 min-w-0"
        >
          <div className="font-medium text-sm text-text-primary truncate">
            {habit.name}
          </div>
          <div className="text-xs text-text-muted">
            {frequencyLabel(habit)}
          </div>
        </Link>

        {habit.category && (
          <Badge className="hidden sm:inline-flex">{habit.category}</Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
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

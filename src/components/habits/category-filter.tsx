"use client";

import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium border transition-colors duration-150",
          selected === null
            ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
            : "bg-surface text-text-muted border-border-subtle hover:text-text-secondary"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors duration-150",
            selected === cat
              ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
              : "bg-surface text-text-muted border-border-subtle hover:text-text-secondary"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

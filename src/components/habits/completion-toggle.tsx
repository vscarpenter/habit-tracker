"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { COMPLETION_ANIMATION_MS } from "@/lib/constants";
import { Check } from "lucide-react";

interface CompletionToggleProps {
  completed: boolean;
  color: string;
  onToggle: () => void;
  size?: "sm" | "md";
}

export function CompletionToggle({
  completed,
  color,
  onToggle,
  size = "md",
}: CompletionToggleProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (!completed) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), COMPLETION_ANIMATION_MS);
    }
    onToggle();
  };

  const sizeClass = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        "transition-all duration-200 border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        sizeClass,
        animating && "animate-completion-bounce"
      )}
      style={{
        borderColor: completed ? color : "var(--border-subtle)",
        backgroundColor: completed ? color : "var(--surface-paper)",
      }}
      aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
      aria-pressed={completed}
    >
      {completed && <Check className={cn(iconSize, "text-white")} />}
    </button>
  );
}

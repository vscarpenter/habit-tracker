"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { Habit } from "@/types";

interface ValueInputProps {
  habit: Habit;
  currentValue: number;
  onValueChange: (value: number) => void;
}

const DEBOUNCE_MS = 500;
const LONG_PRESS_MS = 400;
const LONG_PRESS_INCREMENT = 5;

export function ValueInput({ habit, currentValue, onValueChange }: ValueInputProps) {
  const [localValue, setLocalValue] = useState(currentValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const longPressRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync from parent when currentValue changes externally
  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue]);

  const commitValue = useCallback(
    (val: number) => {
      const clamped = Math.max(0, val);
      setLocalValue(clamped);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onValueChange(clamped);
      }, DEBOUNCE_MS);
    },
    [onValueChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      clearTimeout(longPressRef.current);
    };
  }, []);

  const handleIncrement = () => commitValue(localValue + 1);
  const handleDecrement = () => commitValue(Math.max(0, localValue - 1));

  const handleLongPressStart = (direction: "up" | "down") => {
    longPressRef.current = setTimeout(() => {
      if (direction === "up") {
        commitValue(localValue + LONG_PRESS_INCREMENT);
      } else {
        commitValue(Math.max(0, localValue - LONG_PRESS_INCREMENT));
      }
    }, LONG_PRESS_MS);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressRef.current);
  };

  const target = habit.targetValue ?? 0;
  const isComplete = target > 0 ? localValue >= target : localValue > 0;
  const progressPct = target > 0 ? Math.min((localValue / target) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={localValue}
            onChange={(e) => commitValue(Number(e.target.value) || 0)}
            className={cn(
              "w-16 rounded-lg border bg-transparent px-2 py-1 text-center text-sm font-bold tabular-nums",
              "focus:outline-none focus:ring-2 focus:ring-accent-blue",
              isComplete
                ? "border-accent-emerald/50 text-accent-emerald"
                : "border-border-subtle text-text-primary"
            )}
            aria-label={`Value for ${habit.name}`}
          />
          {target > 0 && (
            <span className="text-xs text-text-muted">
              / {target} {habit.unit ?? ""}
            </span>
          )}
          {target === 0 && habit.unit && (
            <span className="text-xs text-text-muted">{habit.unit}</span>
          )}
        </div>
        {target > 0 && (
          <Progress value={progressPct} className="mt-1.5 h-1.5" color={habit.color} />
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          onMouseDown={() => handleLongPressStart("down")}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={() => handleLongPressStart("down")}
          onTouchEnd={handleLongPressEnd}
          disabled={localValue <= 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-paper/50 text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-30"
          aria-label="Decrease value"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleIncrement}
          onMouseDown={() => handleLongPressStart("up")}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={() => handleLongPressStart("up")}
          onTouchEnd={handleLongPressEnd}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-paper/50 text-text-secondary transition-colors hover:bg-surface-muted"
          aria-label="Increase value"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

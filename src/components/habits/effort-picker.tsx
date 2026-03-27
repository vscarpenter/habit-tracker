"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EffortRating } from "@/types";

interface EffortPickerProps {
  onSelect: (effort: EffortRating | null) => void;
  visible: boolean;
}

const AUTO_DISMISS_MS = 5000;
const SELECT_DISMISS_MS = 400;

export function EffortPicker({ onSelect, visible }: EffortPickerProps) {
  const [selected, setSelected] = useState<EffortRating | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-dismiss after 5s of no interaction
  useEffect(() => {
    if (!visible) return;

    timerRef.current = setTimeout(() => {
      onSelect(null);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timerRef.current);
  }, [visible, onSelect]);

  function handleSelect(effort: EffortRating) {
    setSelected(effort);
    clearTimeout(timerRef.current);
    setTimeout(() => {
      onSelect(effort);
      setSelected(null);
    }, SELECT_DISMISS_MS);
  }

  function handleSkip() {
    clearTimeout(timerRef.current);
    onSelect(null);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 pb-3 pt-1">
            <span className="text-xs text-text-muted mr-1">Effort:</span>
            <div className="flex items-center gap-1" role="group" aria-label="Rate effort 1 to 5">
              {([1, 2, 3, 4, 5] as const).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleSelect(rating)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
                    "hover:bg-accent-amber/10 focus-visible:ring-2 focus-visible:ring-accent-amber",
                    selected !== null && rating <= selected
                      ? "text-accent-amber"
                      : "text-text-muted/40"
                  )}
                  aria-label={`Effort ${rating} of 5`}
                >
                  <Flame className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="ml-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

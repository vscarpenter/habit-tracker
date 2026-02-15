"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-pressed={pressed}
        disabled={disabled}
        onClick={() => onPressedChange(!pressed)}
        className={cn(
          "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium",
          "transition-colors duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          pressed
            ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
            : "bg-surface text-text-secondary border border-border-subtle hover:bg-surface-elevated",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };

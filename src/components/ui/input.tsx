"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-border-subtle bg-surface-paper px-3 py-2 shadow-[var(--shadow-editorial-sm)]",
          "text-sm text-text-primary placeholder:text-text-muted",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-ring/70 focus:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

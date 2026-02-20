"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "accent";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-text-secondary border border-border-subtle",
  success: "bg-success/12 text-success border border-success/30",
  warning: "bg-warning/12 text-warning border border-warning/30",
  error: "bg-error/12 text-error border border-error/30",
  accent: "bg-accent-blue/12 text-accent-blue border border-accent-blue/30",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };

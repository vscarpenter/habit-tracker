"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-white/20 bg-accent-blue text-white hover:brightness-110 shadow-[0_14px_26px_-16px_var(--accent-blue)]",
  secondary:
    "bg-surface-paper text-text-primary hover:bg-surface-strong border border-border-subtle shadow-[var(--shadow-editorial-sm)]",
  ghost:
    "text-text-secondary hover:bg-surface-tint/70 hover:text-text-primary",
  destructive:
    "border border-white/15 bg-error text-white hover:brightness-110 shadow-[0_12px_24px_-16px_var(--error)]",
  outline:
    "border border-border-subtle text-text-primary bg-surface-overlay/60 hover:bg-surface-tint/70",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };

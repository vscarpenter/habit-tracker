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

const variantClass: Record<ButtonVariant, string> = {
  primary:     "btn btn-primary",
  secondary:   "btn btn-secondary",
  ghost:       "btn btn-ghost",
  destructive: "btn btn-danger",
  outline:     "btn btn-secondary",
};

const sizeClass: Record<ButtonSize, string> = {
  sm:   "h-8  px-3   text-caption",
  md:   "h-9  px-4   text-small",
  lg:   "h-11 px-6   text-body",
  icon: "h-9  w-9    p-0",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          variantClass[variant],
          sizeClass[size],
          "disabled:pointer-events-none disabled:opacity-50",
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

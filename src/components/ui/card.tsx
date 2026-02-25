"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "interactive";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-surface-panel backdrop-blur-2xl border border-border-subtle shadow-[var(--shadow-editorial-sm)]",
  elevated:
    "bg-surface-paper backdrop-blur-2xl border border-border-subtle shadow-[var(--shadow-editorial-md)]",
  interactive:
    "bg-surface-panel backdrop-blur-2xl border border-border-subtle shadow-[var(--shadow-editorial-sm)] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-editorial-md)] transition-all duration-200 cursor-pointer",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-4 sm:p-6", variantStyles[variant], className)}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4 border-b border-border-subtle/70 pb-3", className)} {...props} />
));

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-text-primary", className)}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-1 text-sm text-text-secondary", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };

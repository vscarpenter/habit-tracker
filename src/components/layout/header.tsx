"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className, title, subtitle, actions, eyebrow = "HabitFlow", ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn("mb-6 sm:mb-8", className)}
        {...props}
      >
        <div className="rounded-2xl border border-border-subtle/80 bg-surface/70 p-4 shadow-sm backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {eyebrow}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-text-primary">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm text-text-secondary sm:text-[15px]">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 self-start rounded-xl border border-border-subtle bg-surface-strong/85 p-1.5 shadow-sm">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";

export { Header };

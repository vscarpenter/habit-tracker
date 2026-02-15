"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className, title, subtitle, actions, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn("mb-6 sm:mb-8", className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";

export { Header };

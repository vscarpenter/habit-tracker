"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springGentle } from "@/components/shared/motion";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  accentColor?: string;
}

const textReveal = {
  hidden: { opacity: 0, y: 8, filter: "blur(3px)" },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...springGentle, delay },
  }),
};

const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    { className, title, subtitle, actions, eyebrow = "HabitFlow", accentColor = "var(--accent-blue)", ...props },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn("mb-6 sm:mb-8", className)}
        {...props}
      >
        <div className="hf-hero relative overflow-hidden rounded-3xl p-4 sm:p-5">
          <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 pl-3 sm:pl-4">
              <motion.div
                variants={textReveal}
                initial="hidden"
                animate="show"
                custom={0}
                className="mb-2 inline-flex items-center gap-2 rounded-full border border-border-subtle/80 bg-surface-paper/80 px-2.5 py-1"
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  {eyebrow}
                </p>
              </motion.div>
              <motion.h1
                variants={textReveal}
                initial="hidden"
                animate="show"
                custom={0.05}
                className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-text-primary"
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p
                  variants={textReveal}
                  initial="hidden"
                  animate="show"
                  custom={0.1}
                  className="mt-2 max-w-2xl text-sm font-medium text-text-secondary sm:text-[15px]"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
            {actions && (
              <motion.div
                variants={textReveal}
                initial="hidden"
                animate="show"
                custom={0.15}
                className="hf-row flex items-center gap-2 self-start rounded-2xl p-1.5"
              >
                {actions}
              </motion.div>
            )}
          </div>
          <div
            aria-hidden
            className="relative z-[1] mt-4 h-px rounded-full bg-gradient-to-r from-border-strong via-border-subtle/80 to-transparent"
          />
          <motion.div
            aria-hidden
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 0.8 }}
            transition={{ ...springGentle, delay: 0.2 }}
            style={{ backgroundColor: accentColor, transformOrigin: "top" }}
            className="pointer-events-none absolute bottom-5 left-4 top-5 w-[3px] rounded-full sm:left-5"
          />
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";

export { Header };

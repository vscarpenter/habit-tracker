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
  hidden: { opacity: 0, y: 8 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...springGentle, delay },
  }),
};

const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      actions,
      eyebrow = "HabitFlow",
      accentColor,
      ...props
    },
    ref
  ) => {
    return (
      <header ref={ref} className={cn("mb-6 sm:mb-8", className)} {...props}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <motion.span
              variants={textReveal}
              initial="hidden"
              animate="show"
              custom={0}
              className="eyebrow"
              style={
                accentColor
                  ? ({ "--inkwell-eyebrow-accent": accentColor } as React.CSSProperties)
                  : undefined
              }
            >
              {eyebrow}
            </motion.span>
            <motion.h1
              variants={textReveal}
              initial="hidden"
              animate="show"
              custom={0.05}
              className="mt-2 font-serif text-h1 font-medium leading-tight tracking-tight text-slate"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                variants={textReveal}
                initial="hidden"
                animate="show"
                custom={0.1}
                className="mt-2 max-w-2xl text-body text-gray-700"
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
              className="flex items-center gap-2 self-start sm:self-end"
            >
              {actions}
            </motion.div>
          )}
        </div>
        <hr className="mt-5 border-0 border-t border-gray-300" />
      </header>
    );
  }
);

Header.displayName = "Header";

export { Header };

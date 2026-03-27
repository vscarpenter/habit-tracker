"use client";

import { motion, type Variants, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─── Spring presets ─── */
export const springGentle: Transition = { type: "spring", stiffness: 260, damping: 25 };
export const springSnappy: Transition = { type: "spring", stiffness: 400, damping: 30 };
export const springBouncy: Transition = { type: "spring", stiffness: 300, damping: 20 };

/* ─── Stagger container ─── */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/* ─── Fade-up item (for stagger children) ─── */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: springGentle,
  },
};

/* ─── Scale-fade item ─── */
export const scaleFadeItem: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: springGentle,
  },
};

/* ─── Interactive card hover/tap props ─── */
export const cardInteraction = {
  whileHover: { y: -4, transition: springGentle },
  whileTap: { scale: 0.98, transition: springSnappy },
};

/* ─── Interactive button hover/tap props ─── */
export const buttonInteraction = {
  whileHover: { y: -2, scale: 1.02, transition: springGentle },
  whileTap: { scale: 0.97, transition: springSnappy },
};

/* ─── Floating card wrapper ─── */
interface MotionCardProps {
  className?: string;
  interactive?: boolean;
  children: React.ReactNode;
}

export function MotionCard({ className, interactive = true, children }: MotionCardProps) {
  return (
    <motion.div
      variants={fadeUpItem}
      {...(interactive ? cardInteraction : {})}
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "dark:border-slate-700/40 dark:bg-slate-900/70",
        "transition-shadow duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/* ─── Page wrapper with stagger ─── */
export function MotionPage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={cn("space-y-6", className)}
    >
      {children}
    </motion.div>
  );
}

/* ─── List item with stagger ─── */
export function MotionListItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUpItem}
      className={className}
    >
      {children}
    </motion.div>
  );
}

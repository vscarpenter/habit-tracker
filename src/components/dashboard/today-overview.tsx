"use client";

import { motion } from "framer-motion";
import { Flame, Target, TrendingUp, Zap } from "lucide-react";
import { CompactProgressBar } from "./compact-progress-bar";
import { Badge } from "@/components/ui/badge";
import { MotionCard, fadeUpItem, staggerContainer, springGentle } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

interface TodayOverviewProps {
  scheduledCount: number;
  completedCount: number;
  remainingCount: number;
  completionRate: number;
  focusCategories: string[];
  streakingCount: number;
  showStreaks: boolean;
  showCompletionRate: boolean;
}

interface BentoStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}

function BentoStat({ icon, label, value, accent }: BentoStatProps) {
  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={{ y: -4, transition: springGentle }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "stat-card group relative overflow-hidden cursor-default",
        "transition-shadow duration-200 hover:shadow-md"
      )}
    >
      <div
        aria-hidden
        className="absolute left-0 top-3 h-5 w-[3px] rounded-r-full"
        style={{ backgroundColor: accent }}
      />

      <div
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight text-text-primary">{value}</p>
      <p className="text-xs font-medium text-text-muted">{label}</p>
    </motion.div>
  );
}

export function TodayOverview({
  scheduledCount,
  completedCount,
  remainingCount,
  completionRate,
  focusCategories,
  streakingCount,
  showStreaks,
  showCompletionRate,
}: TodayOverviewProps) {
  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4",
          showCompletionRate ? "sm:grid-cols-4" : "sm:grid-cols-3"
        )}
      >
        <BentoStat
          icon={<Target className="h-4 w-4" />}
          label="Scheduled"
          value={scheduledCount}
          accent="var(--accent-blue)"
        />
        <BentoStat
          icon={<Zap className="h-4 w-4" />}
          label="Completed"
          value={completedCount}
          accent="var(--accent-emerald)"
        />
        {showCompletionRate && (
          <BentoStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Completion"
            value={`${completionRate}%`}
            accent="var(--accent-violet)"
          />
        )}
        <BentoStat
          icon={<Flame className="h-4 w-4" />}
          label="Streaking"
          value={showStreaks ? streakingCount : "—"}
          accent="var(--accent-amber)"
        />
      </motion.div>

      <MotionCard className="overflow-hidden p-5 sm:p-6" interactive={false}>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="hf-kicker">Today&apos;s Momentum</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              {completedCount} of {scheduledCount} habits complete
            </h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              {remainingCount === 0
                ? "All scheduled habits are done. Keep this rhythm going."
                : `${remainingCount} left today. Small steps compound quickly.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {showCompletionRate && (
              <Badge variant="accent" className="px-3 py-1 text-[11px]">
                {completionRate}% completion
              </Badge>
            )}
            {showStreaks && streakingCount > 0 && (
              <Badge className="px-3 py-1 text-[11px]">
                {streakingCount} streaking
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle/75 bg-surface-overlay/70 p-3 sm:p-4">
          <CompactProgressBar completed={completedCount} total={scheduledCount} />

          {focusCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-muted">Focus areas:</span>
              {focusCategories.map((category) => (
                <Badge key={category} className="text-[11px]">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </MotionCard>
    </>
  );
}

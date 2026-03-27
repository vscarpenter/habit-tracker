import { cn } from "@/lib/utils";

interface LegendPillProps {
  colorClass: string;
  label: string;
}

export function LegendPill({ colorClass, label }: LegendPillProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle/70 bg-surface-paper/50 px-2 py-1">
      <span className={cn("h-2.5 w-2.5 rounded-full", colorClass)} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

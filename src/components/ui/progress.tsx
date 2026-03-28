import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  color?: string;
}

export function Progress({ value, className, color }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface-muted", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${clamped}%`,
          backgroundColor: color ?? "var(--accent-blue)",
        }}
      />
    </div>
  );
}

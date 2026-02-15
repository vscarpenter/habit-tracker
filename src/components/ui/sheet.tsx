"use client";

import { forwardRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type SheetSide = "top" | "right" | "bottom" | "left";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: SheetSide;
  children: React.ReactNode;
}

const sideStyles: Record<SheetSide, string> = {
  top: "inset-x-0 top-0 rounded-b-2xl animate-slide-down",
  right: "inset-y-0 right-0 w-3/4 max-w-sm rounded-l-2xl animate-slide-left",
  bottom: "inset-x-0 bottom-0 rounded-t-2xl animate-slide-up",
  left: "inset-y-0 left-0 w-3/4 max-w-sm rounded-r-2xl animate-slide-right",
};

function Sheet({ open, onOpenChange, side = "bottom", children }: SheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 animate-overlay-fade"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed z-50 bg-surface-elevated backdrop-blur-xl border border-border shadow-xl p-6",
          sideStyles[side]
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

const SheetHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4", className)} {...props} />
));

SheetHeader.displayName = "SheetHeader";

const SheetTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-text-primary", className)}
    {...props}
  />
));

SheetTitle.displayName = "SheetTitle";

export { Sheet, SheetHeader, SheetTitle };

"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UpdateBannerProps {
  visible: boolean;
  onRefresh: () => void;
  className?: string;
}

export function UpdateBanner({ visible, onRefresh, className }: UpdateBannerProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 rounded-xl px-4 py-3",
        "bg-accent-blue text-white shadow-xl animate-fade-in",
        className
      )}
    >
      <span className="text-sm font-medium">A new version is available</span>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
      >
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Refresh
      </Button>
    </div>
  );
}

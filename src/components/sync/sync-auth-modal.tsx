/**
 * SyncAuthModal — sign-in UI for enabling cloud sync.
 *
 * Sign-in option:
 *   1. Google OAuth
 */

"use client";

import { useState } from "react";
import { Chrome } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SyncAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoogle: () => Promise<void>;
}

type Step = "ready" | "loading";

export function SyncAuthModal({
  open,
  onOpenChange,
  onGoogle,
}: SyncAuthModalProps) {
  const [step, setStep] = useState<Step>("ready");
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setStep("loading");
    try {
      await onGoogle();
      // OAuth flow handles the post-auth navigation/popup lifecycle.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setStep("ready");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (nextOpen) return;
    // Reset state after close animation
    setTimeout(() => {
      setStep("ready");
      setError(null);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Enable Sync</h2>
          <p className="mt-1 text-sm text-text-muted">
            Sign in with Google to sync your habits across devices. Your data is
            encrypted in transit.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {step === "ready" && (
          <div className="space-y-3">
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-border-subtle",
                "bg-surface-overlay/45 px-4 py-3 text-left text-sm font-medium",
                "text-text-primary transition-colors hover:bg-surface-paper/70"
              )}
              onClick={handleGoogle}
            >
              <Chrome className="h-4 w-4 shrink-0 text-text-muted" />
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {step === "loading" && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
          </div>
        )}
      </div>
    </Dialog>
  );
}

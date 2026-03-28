/**
 * SyncAuthModal — sign-in UI for enabling cloud sync.
 *
 * Sign-in option:
 *   1. Google OAuth
 */

"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface SyncAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoogle: () => Promise<void>;
}

type Step = "ready" | "loading";

const DIALOG_CLOSE_ANIMATION_MS = 200;

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
      logger.warn("Google sign-in failed:", err);
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
    }, DIALOG_CLOSE_ANIMATION_MS);
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
            <AlertCircle className="mr-1.5 inline-block h-4 w-4 align-text-bottom" />
            {error}
          </p>
        )}

        {step === "ready" && (
          <div className="space-y-3">
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-border-subtle",
                "bg-surface-overlay/45 px-4 py-3 text-left text-sm font-medium",
                "text-text-primary transition-colors hover:bg-surface-paper/70"
              )}
              onClick={handleGoogle}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32l3.56 2.76c2.07-1.91 3.28-4.73 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09a7.12 7.12 0 0 1 0-4.18V7.07H2.18A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.76.01-.55z" fill="#FBBC05" />
                <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.19 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335" />
              </svg>
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

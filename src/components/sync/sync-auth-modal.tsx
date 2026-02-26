/**
 * SyncAuthModal — sign-in UI for enabling cloud sync.
 *
 * Two sign-in options:
 *   1. Magic link (email, no password) — primary
 *   2. Google OAuth — secondary (requires Google provider in Supabase dashboard)
 *
 * After sending a magic link the modal shows a confirmation message.
 * After Google OAuth the page is redirected by Supabase — no further action needed here.
 */

"use client";

import { useState } from "react";
import { Mail, Chrome } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SyncAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMagicLink: (email: string) => Promise<void>;
  onGoogle: () => Promise<void>;
}

type Step = "choose" | "magic-link" | "magic-link-sent" | "loading";

export function SyncAuthModal({
  open,
  onOpenChange,
  onMagicLink,
  onGoogle,
}: SyncAuthModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setStep("loading");
    try {
      await onMagicLink(email.trim());
      setStep("magic-link-sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send link");
      setStep("magic-link");
    }
  }

  async function handleGoogle() {
    setError(null);
    setStep("loading");
    try {
      await onGoogle();
      // Page will redirect — no need to update step
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setStep("choose");
    }
  }

  function handleClose() {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("choose");
      setEmail("");
      setError(null);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Enable Sync</h2>
          <p className="mt-1 text-sm text-text-muted">
            Sign in to sync your habits across devices. Your data is stored securely
            and encrypted in transit.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {step === "choose" && (
          <div className="space-y-3">
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-border-subtle",
                "bg-surface-overlay/45 px-4 py-3 text-left text-sm font-medium",
                "text-text-primary transition-colors hover:bg-surface-paper/70"
              )}
              onClick={() => setStep("magic-link")}
            >
              <Mail className="h-4 w-4 shrink-0 text-accent-blue" />
              <span>Continue with email (magic link)</span>
            </button>

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

        {step === "magic-link" && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sync-email">Email address</Label>
              <Input
                id="sync-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setStep("choose")}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={!email.trim()}>
                Send magic link
              </Button>
            </div>
          </form>
        )}

        {step === "magic-link-sent" && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue/10">
                <Mail className="h-6 w-6 text-accent-blue" />
              </div>
            </div>
            <div>
              <p className="font-medium text-text-primary">Check your email</p>
              <p className="mt-1 text-sm text-text-muted">
                We sent a sign-in link to{" "}
                <span className="font-medium text-text-secondary">{email}</span>.
                Click the link to finish signing in.
              </p>
            </div>
            <Button variant="ghost" className="w-full" onClick={handleClose}>
              Done
            </Button>
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

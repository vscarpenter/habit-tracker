"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, BottomNav } from "./nav-bar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useHabits } from "@/hooks/use-habits";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { KeyboardShortcutsModal } from "@/components/shared/keyboard-shortcuts-modal";
import { CommandPalette } from "@/components/shared/command-palette";
import { UpdateBanner } from "@/components/shared/update-banner";
import type { ShortcutConfig } from "@/hooks/use-keyboard-shortcuts";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { activeHabits } = useHabits();
  const { updateAvailable, applyUpdate } = useServiceWorker();

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const shortcuts = useMemo<ShortcutConfig[]>(
    () => [
      { key: "n", handler: () => router.push("/habits/new") },
      { key: "t", handler: () => router.push("/") },
      { key: "w", handler: () => router.push("/week") },
      { key: "m", handler: () => router.push("/month") },
      { key: "s", handler: () => router.push("/stats") },
      { key: "?", handler: () => setShortcutsOpen(true) },
      { key: "k", ctrlOrCmd: true, handler: () => setPaletteOpen(true) },
    ],
    [router]
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar />
      <BottomNav />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute left-[20%] top-[-6rem] h-64 w-64 rounded-full bg-accent-cyan/10 blur-3xl" />
        <div className="absolute right-[8%] top-10 h-56 w-56 rounded-full bg-accent-amber/10 blur-3xl" />
        <div className="absolute bottom-[8%] left-[35%] h-72 w-72 rounded-full bg-accent-blue/7 blur-3xl" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-background-alt/70 via-background-alt/30 to-transparent lg:left-64"
      />

      <main id="main-content" className="relative z-10 pb-32 lg:pl-64 lg:pb-0">
        {children}
      </main>

      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} habits={activeHabits} />
      <UpdateBanner visible={updateAvailable} onRefresh={applyUpdate} />
    </div>
  );
}

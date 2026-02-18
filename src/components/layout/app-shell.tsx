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
      { key: "s", handler: () => router.push("/stats") },
      { key: "?", handler: () => setShortcutsOpen(true) },
      { key: "k", ctrlOrCmd: true, handler: () => setPaletteOpen(true) },
    ],
    [router]
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />

      <main id="main-content" className="lg:pl-60 pb-20 lg:pb-0">
        {children}
      </main>

      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} habits={activeHabits} />
      <UpdateBanner visible={updateAvailable} onRefresh={applyUpdate} />
    </div>
  );
}

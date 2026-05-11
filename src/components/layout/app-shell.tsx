"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, BottomNav } from "./nav-bar";
import { AppFooter } from "./app-footer";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useHabits } from "@/hooks/use-habits";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { SyncRefreshProvider } from "@/contexts/sync-refresh-context";
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

  useEffect(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    const fadeTimer = setTimeout(() => {
      splash.style.opacity = "0";
      splash.style.pointerEvents = "none";
    }, 1000);
    const hideTimer = setTimeout(() => {
      splash.style.display = "none";
    }, 1400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <SyncRefreshProvider>
      <div className="relative min-h-screen bg-ivory">
        <Sidebar />
        <BottomNav />

        <main id="main-content" className="relative z-10 pb-32 lg:pl-64 lg:pb-0">
          {children}
          <AppFooter />
        </main>

        <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} habits={activeHabits} />
        <UpdateBanner visible={updateAvailable} onRefresh={applyUpdate} />
      </div>
    </SyncRefreshProvider>
  );
}

"use client";

import { useEffect } from "react";
import { useIsDesktop } from "./use-media-query";

export interface ShortcutConfig {
  key: string;
  ctrlOrCmd?: boolean;
  handler: () => void;
  enabled?: boolean;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isDesktop) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (INPUT_TAGS.has(target.tagName) || target.isContentEditable) return;

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;
        if (shortcut.ctrlOrCmd && !(e.metaKey || e.ctrlKey)) continue;
        if (!shortcut.ctrlOrCmd && (e.metaKey || e.ctrlKey)) continue;

        e.preventDefault();
        shortcut.handler();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDesktop, shortcuts]);
}

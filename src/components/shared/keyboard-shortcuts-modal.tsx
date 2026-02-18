"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutEntry {
  keys: string[];
  description: string;
}

const GLOBAL_SHORTCUTS: ShortcutEntry[] = [
  { keys: ["N"], description: "New habit" },
  { keys: ["T"], description: "Go to Today" },
  { keys: ["W"], description: "Go to Week" },
  { keys: ["S"], description: "Go to Stats" },
  { keys: ["?"], description: "Show shortcuts" },
  { keys: ["\u2318", "K"], description: "Command palette" },
];

const PAGE_SHORTCUTS: ShortcutEntry[] = [
  { keys: ["1"], description: "Toggle 1st habit (Today)" },
  { keys: ["\u2190"], description: "Previous week (Week)" },
  { keys: ["\u2192"], description: "Next week (Week)" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 bg-surface border border-border-subtle rounded-md px-1.5 py-0.5 text-xs font-mono text-text-secondary">
      {children}
    </kbd>
  );
}

function ShortcutList({ title, entries }: { title: string; entries: ShortcutEntry[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.description}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-text-secondary">
              {entry.description}
            </span>
            <div className="flex gap-1">
              {entry.keys.map((key, i) => (
                <Kbd key={i}>{key}</Kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <ShortcutList title="Global" entries={GLOBAL_SHORTCUTS} />
          <ShortcutList title="Page-specific" entries={PAGE_SHORTCUTS} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

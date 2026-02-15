"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = {
  Fitness: ["🏃", "💪", "🧘", "🚴", "🏊", "⚽", "🎾", "🏋️"],
  Health: ["💧", "🥗", "😴", "💊", "🧠", "❤️", "🦷", "🩺"],
  Mind: ["📚", "✍️", "🎵", "🧩", "🎨", "📝", "🎯", "💡"],
  Social: ["👋", "📞", "💬", "🤝", "👨‍👩‍👧", "🎁", "💌", "🫂"],
  Work: ["💻", "📊", "📧", "🗂️", "⏰", "📅", "✅", "🚀"],
  Creative: ["📸", "🎬", "🎸", "✂️", "🪴", "🍳", "🧶", "🎭"],
} as const;

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [customEmoji, setCustomEmoji] = useState("");

  return (
    <div className="space-y-3">
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category}>
          <span className="text-xs font-medium text-text-muted mb-1 block">
            {category}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange(emoji)}
                className={cn(
                  "h-9 w-9 rounded-lg text-lg flex items-center justify-center",
                  "transition-all duration-150 hover:bg-surface-elevated",
                  value === emoji &&
                    "bg-accent-blue/10 ring-2 ring-accent-blue scale-110"
                )}
                aria-label={`Select ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div>
        <span className="text-xs font-medium text-text-muted mb-1 block">
          Custom
        </span>
        <input
          type="text"
          value={customEmoji}
          onChange={(e) => {
            const val = e.target.value;
            setCustomEmoji(val);
            if (val.trim()) {
              // Extract first emoji or character
              const segments = [...new Intl.Segmenter().segment(val.trim())];
              if (segments.length > 0) {
                onChange(segments[0].segment);
              }
            }
          }}
          placeholder="Type or paste emoji"
          className="h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          maxLength={4}
        />
      </div>
    </div>
  );
}

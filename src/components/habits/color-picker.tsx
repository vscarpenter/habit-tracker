"use client";

import { cn } from "@/lib/utils";
import { ACCENT_COLORS } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {ACCENT_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            "transition-all duration-150 hover:scale-110",
            value === color.value && "ring-2 ring-offset-2 ring-offset-background"
          )}
          style={{
            backgroundColor: color.value,
            ...(value === color.value ? { boxShadow: `0 0 0 2px ${color.value}` } : {}),
          }}
          aria-label={`Select ${color.name}`}
        >
          {value === color.value && (
            <Check className="h-4 w-4 text-white" />
          )}
        </button>
      ))}
    </div>
  );
}

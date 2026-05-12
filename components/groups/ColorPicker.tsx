"use client";

import { Check } from "lucide-react";
import {
  GROUP_COLORS,
  GROUP_COLOR_NAMES,
  type GroupColor,
} from "@/convex/lib/groupColors";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: GroupColor) => void;
  disabled?: boolean;
}

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Group color"
      className="flex flex-wrap gap-2"
    >
      {GROUP_COLORS.map((color) => {
        const isSelected = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={GROUP_COLOR_NAMES[color]}
            disabled={disabled}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            className={cn(
              "relative h-9 w-9 rounded-sm transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isSelected
                ? "ring-2 ring-text ring-offset-2"
                : "hover:scale-110",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {isSelected && (
              <Check
                size={16}
                strokeWidth={3}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-sm"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

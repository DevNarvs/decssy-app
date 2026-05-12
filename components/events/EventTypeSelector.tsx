"use client";

import { User, Users } from "lucide-react";
import { EVENT_TYPES, type EventType } from "@/convex/lib/enums";
import { cn } from "@/lib/utils";

interface Props {
  value: EventType;
  onChange: (v: EventType) => void;
  disabled?: boolean;
}

export function EventTypeSelector({ value, onChange, disabled }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Event type"
      className="grid grid-cols-2 gap-2"
    >
      {(Object.keys(EVENT_TYPES) as EventType[]).map((key) => {
        const t = EVENT_TYPES[key];
        const selected = key === value;
        const Icon = key === "group_shared" ? Users : User;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-md border-2 px-3 py-3 text-left transition-colors",
              selected
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface hover:bg-surface-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon
                size={16}
                strokeWidth={1.5}
                className={selected ? "text-accent" : "text-text-muted"}
              />
              <span
                className={cn(
                  "text-md font-extrabold",
                  selected ? "text-accent" : "text-text",
                )}
              >
                {t.label}
              </span>
            </div>
            <span className="text-sm text-text-muted">{t.description}</span>
          </button>
        );
      })}
    </div>
  );
}

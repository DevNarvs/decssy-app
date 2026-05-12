"use client";

import { cn } from "@/lib/utils";

interface Props {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isOutOfMonth: boolean;
  eventColors: string[];
  onSelect: () => void;
}

const MAX_VISIBLE_DOTS = 3;

export function DayCell({
  date,
  isToday,
  isSelected,
  isOutOfMonth,
  eventColors,
  onSelect,
}: Props) {
  const visibleColors = eventColors.slice(0, MAX_VISIBLE_DOTS);
  const overflow = eventColors.length - visibleColors.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      aria-label={date.toDateString()}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-start gap-1 rounded-sm p-1 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        isOutOfMonth && "opacity-30",
        isSelected && !isToday && "bg-surface-2",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors",
          isToday
            ? "bg-accent font-extrabold text-white"
            : isSelected
              ? "font-extrabold text-text"
              : "font-bold text-text",
        )}
      >
        {date.getDate()}
      </span>

      {eventColors.length > 0 && (
        <div className="flex items-center gap-0.5">
          {visibleColors.map((color, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          ))}
          {overflow > 0 && (
            <span className="text-[9px] font-bold text-text-muted">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

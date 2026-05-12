"use client";

import { DayCell } from "./DayCell";

interface Props {
  year: number;
  month: number; // 0-indexed
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  eventsByDay: Map<string, string[]>; // key: YYYY-MM-DD local; value: array of group color hexes
}

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

/** YYYY-MM-DD in local time. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthGrid({
  year,
  month,
  selectedDate,
  onSelectDate,
  eventsByDay,
}: Props) {
  const today = new Date();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Sunday

  // The grid is 6 rows × 7 columns (handles months that span 6 weeks).
  // Start from the Sunday on or before the 1st of the month.
  const gridStart = new Date(year, month, 1 - firstWeekday);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-2 shadow-sm">
      <div className="grid grid-cols-7 pb-1">
        {DAY_NAMES.map((d, i) => (
          <div
            key={i}
            className="text-center text-xs font-extrabold uppercase tracking-wide text-text-muted"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          const isOutOfMonth = d.getMonth() !== month;
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDate);
          const eventColors = eventsByDay.get(localDateKey(d)) ?? [];
          return (
            <DayCell
              key={i}
              date={d}
              isToday={isToday}
              isSelected={isSelected}
              isOutOfMonth={isOutOfMonth}
              eventColors={eventColors}
              onSelect={() => onSelectDate(d)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Re-export the helper for the page to share key generation logic.
export { localDateKey };

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarHeader({ year, month, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center justify-between py-3">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous month"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={onToday}
        className="text-md font-extrabold tracking-tight text-text"
      >
        {MONTH_NAMES[month]} {year}
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next month"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

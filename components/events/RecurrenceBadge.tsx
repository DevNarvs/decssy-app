"use client";

import { Repeat } from "lucide-react";

/**
 * Human-readable display for an event's recurrence rule.
 * Maps the 4 supported presets to plain-English labels; falls back to the
 * raw RRULE if it's a pattern we don't recognize.
 */
function describe(rule: string, startDate: Date): string {
  const freqMatch = rule.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/);
  const untilMatch = rule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
  const freq = freqMatch?.[1];

  let base: string;
  switch (freq) {
    case "DAILY":
      base = "Every day";
      break;
    case "WEEKLY":
      base = `Every ${startDate.toLocaleDateString("en-US", { weekday: "long" })}`;
      break;
    case "MONTHLY":
      base = `Every month on the ${startDate.getDate()}${ordinalSuffix(startDate.getDate())}`;
      break;
    case "YEARLY":
      base = `Every year on ${startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
      break;
    default:
      base = "Repeats";
  }

  if (untilMatch) {
    const until = new Date(
      Number(untilMatch[1]),
      Number(untilMatch[2]) - 1,
      Number(untilMatch[3]),
    );
    base += ` until ${until.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }

  return base;
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0] ?? "th";
}

export function RecurrenceBadge({
  rule,
  startDate,
}: {
  rule: string;
  startDate: Date;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent">
      <Repeat size={14} strokeWidth={2} />
      {describe(rule, startDate)}
    </div>
  );
}

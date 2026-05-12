"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Simple preset-based recurrence builder.
 *
 * Presets: Does not repeat, Every day, Every week, Every month, Every year.
 * Plus an optional UNTIL end date.
 *
 * Emits RRULE strings without DTSTART (the server attaches dtstart from the
 * event's startUtc at expansion time). Examples:
 *   - "FREQ=DAILY"
 *   - "FREQ=WEEKLY;UNTIL=20261231T235959Z"
 */
type Preset = "none" | "daily" | "weekly" | "monthly" | "yearly";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "none", label: "Does not repeat" },
  { key: "daily", label: "Every day" },
  { key: "weekly", label: "Every week" },
  { key: "monthly", label: "Every month" },
  { key: "yearly", label: "Every year" },
];

function buildRule(preset: Preset, untilIso?: string): string | undefined {
  if (preset === "none") return undefined;
  const freq = preset.toUpperCase();
  let rule = `FREQ=${freq}`;
  if (untilIso) {
    // YYYY-MM-DD → YYYYMMDDT235959Z (end of day UTC for forgiveness)
    const compact = untilIso.replace(/-/g, "");
    rule += `;UNTIL=${compact}T235959Z`;
  }
  return rule;
}

function parseRule(rule: string | undefined): {
  preset: Preset;
  untilIso?: string;
} {
  if (!rule) return { preset: "none" };
  const freqMatch = rule.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/);
  const untilMatch = rule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
  const preset = (freqMatch?.[1]?.toLowerCase() ?? "none") as Preset;
  const untilIso = untilMatch
    ? `${untilMatch[1]}-${untilMatch[2]}-${untilMatch[3]}`
    : undefined;
  return { preset, untilIso };
}

interface Props {
  value: string | undefined;
  onChange: (rule: string | undefined) => void;
  disabled?: boolean;
}

export function RecurrenceSelector({ value, onChange, disabled }: Props) {
  const initial = useMemo(() => parseRule(value), [value]);
  const [preset, setPreset] = useState<Preset>(initial.preset);
  const [untilIso, setUntilIso] = useState<string>(initial.untilIso ?? "");
  const id = useId();

  function updatePreset(p: Preset) {
    setPreset(p);
    onChange(buildRule(p, p === "none" ? undefined : untilIso || undefined));
  }
  function updateUntil(iso: string) {
    setUntilIso(iso);
    if (preset !== "none") {
      onChange(buildRule(preset, iso || undefined));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={`${id}-preset`}
        className="text-sm font-bold text-text-muted"
      >
        Repeats
      </label>
      <select
        id={`${id}-preset`}
        value={preset}
        onChange={(e) => updatePreset(e.target.value as Preset)}
        disabled={disabled}
        className={cn(
          "h-11 rounded-md border border-border bg-surface px-3 text-md text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "disabled:opacity-60",
        )}
      >
        {PRESETS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>

      {preset !== "none" && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${id}-until`}
            className="text-sm font-bold text-text-muted"
          >
            Until <span className="font-normal">(optional)</span>
          </label>
          <input
            id={`${id}-until`}
            type="date"
            value={untilIso}
            onChange={(e) => updateUntil(e.target.value)}
            disabled={disabled}
            className={cn(
              "h-11 rounded-md border border-border bg-surface px-3 text-md text-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              "disabled:opacity-60",
            )}
          />
        </div>
      )}
    </div>
  );
}

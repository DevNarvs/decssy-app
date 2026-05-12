"use client";

import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Formats event time per PRD §14: timed events shown in viewer's local tz;
 * all-day events shown in the event's authored tz (so "Friday May 10"
 * stays Friday regardless of where the viewer is).
 */
export function EventTimeDisplay({
  event,
  short = false,
}: {
  event: Doc<"events">;
  short?: boolean;
}) {
  if (event.isAllDay) {
    const d = new Date(event.startUtc);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: event.eventTimezone,
      weekday: short ? "short" : "long",
      month: "short",
      day: "numeric",
      year: short ? undefined : "numeric",
    });
    return (
      <span>
        {fmt.format(d)} · <span className="text-text-muted">All day</span>
      </span>
    );
  }
  const start = new Date(event.startUtc);
  const end = new Date(event.endUtc);
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: short ? "short" : "long",
    month: "short",
    day: "numeric",
    year: short ? undefined : "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <span>
      {dateFmt.format(start)} · {timeFmt.format(start)}–{timeFmt.format(end)}
    </span>
  );
}

/**
 * Recurring event expansion.
 *
 * Given a parent event and a date range, returns virtual instances within
 * that range. For non-recurring events, returns the parent iff it falls in
 * range. Virtual instances reuse the parent _id so all routing/details
 * point back to the same event row — Plan 7 ships single-series edit only;
 * per-instance overrides are a Plan 10 polish task.
 *
 * The `rrule` package is pure JS, runs fine in Convex's V8 isolate.
 */
import { RRule } from "rrule";
import type { Doc } from "../_generated/dataModel";

export function expandOccurrences(
  event: Doc<"events">,
  rangeStart: number,
  rangeEnd: number,
): Doc<"events">[] {
  if (event.recurrenceRule === undefined) {
    if (event.startUtc >= rangeStart && event.startUtc <= rangeEnd) {
      return [event];
    }
    return [];
  }

  const duration = event.endUtc - event.startUtc;
  const dtstart = new Date(event.startUtc);

  let rule: RRule;
  try {
    const ruleStr = event.recurrenceRule.startsWith("RRULE:")
      ? event.recurrenceRule
      : `RRULE:${event.recurrenceRule}`;
    const parsed = RRule.fromString(ruleStr);
    // Re-construct with dtstart attached.
    rule = new RRule({ ...parsed.origOptions, dtstart });
  } catch {
    // Malformed RRULE — silently treat as one-off so the calendar doesn't crash.
    if (event.startUtc >= rangeStart && event.startUtc <= rangeEnd) {
      return [event];
    }
    return [];
  }

  const occurrences = rule.between(
    new Date(rangeStart),
    new Date(rangeEnd),
    true, // inclusive
  );

  return occurrences.map((occStart) => ({
    ...event,
    startUtc: occStart.getTime(),
    endUtc: occStart.getTime() + duration,
  }));
}

/**
 * Client-side iCalendar (.ics, RFC 5545) generation for a single event.
 *
 * We build the file in the browser from the event the page already has
 * (via getEvent) and trigger a download — no server endpoint, no token, no
 * external-fetcher auth surface. This is a one-time snapshot (the right
 * default for a single event); live subscription feeds are out of scope.
 *
 * RFC 5545 details that actually matter for Google/Apple/Outlook to accept
 * the file: CRLF line endings, 75-OCTET line folding, text escaping, all-day
 * VALUE=DATE with an EXCLUSIVE DTEND, and a stable UID.
 */
import type { Doc } from "@/convex/_generated/dataModel";

const PRODID = "-//Decssy//Calendar 1.0//EN";

type IcsEvent = Pick<
  Doc<"events">,
  "_id" | "title" | "startUtc" | "endUtc" | "isAllDay" | "eventTimezone"
> & {
  description?: string;
  location?: string;
  recurrenceRule?: string;
};

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold to <= 75 OCTETS (UTF-8 bytes); continuation lines begin with a space.
function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  let out = "";
  let cur = "";
  for (const ch of line) {
    const next = cur + ch;
    const limit = out === "" ? 75 : 74; // continuation lines lose 1 to the leading space
    if (enc.encode(next).length > limit) {
      out += (out === "" ? "" : "\r\n ") + cur;
      cur = ch;
    } else {
      cur = next;
    }
  }
  out += (out === "" ? "" : "\r\n ") + cur;
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");

// UTC form: 20260619T133000Z — needs no VTIMEZONE block.
function formatUtc(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

// All-day DATE in the event's own tz: 20260619 (so it lands on the right day
// regardless of the viewer's tz).
function formatDate(ms: number, tz: string): string {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
  return s.replace(/-/g, "");
}

function vevent(e: IcsEvent, now: number): string[] {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${e._id}@decssy.app`,
    `DTSTAMP:${formatUtc(now)}`,
  ];

  if (e.isAllDay) {
    // DTEND is EXCLUSIVE for all-day events: add one day to the end date.
    const endExclusive = e.endUtc + 24 * 60 * 60 * 1000;
    lines.push(`DTSTART;VALUE=DATE:${formatDate(e.startUtc, e.eventTimezone)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(endExclusive, e.eventTimezone)}`);
  } else {
    lines.push(`DTSTART:${formatUtc(e.startUtc)}`);
    lines.push(`DTEND:${formatUtc(e.endUtc)}`);
  }

  lines.push(`SUMMARY:${escapeText(e.title)}`);
  if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
  if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
  if (e.recurrenceRule) {
    lines.push(`RRULE:${e.recurrenceRule.replace(/^RRULE:/i, "")}`);
  }
  lines.push("END:VEVENT");
  return lines.map(foldLine);
}

export function serializeEventIcs(e: IcsEvent): string {
  const now = Date.now();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(e.title)}`),
    ...vevent(e, now),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

/** Build the .ics and trigger a browser download. */
export function downloadEventIcs(e: IcsEvent): void {
  const ics = serializeEventIcs(e);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug =
    e.title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "event";
  a.download = `${slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

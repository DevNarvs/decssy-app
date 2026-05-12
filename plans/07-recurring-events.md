# Plan 7: Recurring Events — Implementation Plan

> Yolo-mode compact. Scope reduced: single-series edit/cancel (no per-instance exceptions); patterns are daily/weekly/monthly/yearly with optional UNTIL end date. Per-instance overrides → Plan 10.

**Goal:** A user can create a recurring event with a few preset patterns (every day, every week, every month, every year) + an optional end date. The calendar and agenda render every occurrence. Editing or cancelling the event affects the entire series.

**Architecture:**
- `events.recurrenceRule` column added (RFC 5545 RRULE string; `undefined` = one-off)
- `rrule` npm package handles parsing + expansion in both server (Convex) and client (form preview)
- `expandEventOccurrences(event, rangeStart, rangeEnd)` utility returns virtual instances within a range
- `listMyEventsInRange` + `listUpcomingEventsInGroup` queries call the expansion so the calendar shows every occurrence
- Each virtual instance reuses the parent event's `_id` for routing — tapping any occurrence opens the same detail page (one-shot edit affects all)
- Detail page surfaces the recurrence in a banner ("Repeats every Monday")
- **Deferred to Plan 10**: per-instance edit ("only this event"), per-instance cancel, count-based end ("after 10 occurrences"), advanced patterns (BYSETPOS, etc.)

**Out of scope:**
- Per-instance exceptions
- "After N occurrences" end condition (UI shows it; backend treats as no-end + we expand to range only)
- Custom intervals ("every 2 weeks")
- Multi-day-of-week (weekly always picks a single weekday from start date for MVP)

---

## File structure (delta)

```
decssy/
├─ convex/
│  ├─ schema.ts                        ← MODIFIED (add recurrenceRule)
│  ├─ events.ts                        ← MODIFIED (3 queries expand recurrence)
│  └─ lib/recurrence.ts                ← NEW
├─ components/events/
│  ├─ RecurrenceSelector.tsx           ← NEW (preset dropdown + optional end date)
│  ├─ EventCreateForm.tsx              ← MODIFIED (include RecurrenceSelector)
│  └─ RecurrenceBadge.tsx              ← NEW (human-readable "Every Monday until …")
└─ app/(app)/groups/[id]/events/[eid]/page.tsx ← MODIFIED (show badge)
```

---

## Tasks

### Task 0: Pre-flight + install
```bash
git status
npm install rrule
```

### Task 1: Schema — add recurrenceRule
Modify `convex/schema.ts` events table:

```typescript
events: defineTable({
  // ... existing fields
  recurrenceRule: v.optional(v.string()), // RFC 5545 RRULE; undefined = one-off
  // ... existing fields stay
})
```

Deploy + commit.

### Task 2: Recurrence utility

Create `convex/lib/recurrence.ts`:

```typescript
"use node";

import { RRule } from "rrule";
import type { Doc } from "../_generated/dataModel";

/**
 * Expand a recurring event into virtual instances within [rangeStart, rangeEnd].
 * For a non-recurring event, returns the event itself iff it falls in range.
 *
 * The returned instances reuse the parent event's _id — they're "virtual"
 * representations. Routing to /groups/[id]/events/[eid] uses the parent id,
 * so tapping an occurrence opens the parent's detail.
 *
 * Duration is preserved: each instance's endUtc = startUtc + (parent.endUtc - parent.startUtc).
 */
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

  // RRule.fromString expects "RRULE:..." or just the rule part. Either works.
  const rule = RRule.fromString(
    event.recurrenceRule.startsWith("RRULE:")
      ? event.recurrenceRule
      : `RRULE:${event.recurrenceRule}`,
  );
  // Manually attach DTSTART (RRule npm package needs it on the options).
  const dt = new RRule({
    ...rule.options,
    dtstart,
  });

  const occurrences = dt.between(
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
```

Note: `rrule` is pure JS, no Node deps, but the helper is in `lib/` and used by query handlers (not "use node"). However, putting `import { RRule } from "rrule"` inside a query module requires it not be a Node-only package. Verify in execution; if it fails, move expansion server-side via an action call (slow but works).

Commit.

### Task 3: Update queries to expand recurrence

Modify `convex/events.ts`:
- `listMyEventsInRange` → after collecting events, run each through `expandOccurrences` and replace the flat list with the expansion union
- `listUpcomingEventsInGroup` → same pattern, then slice the top `limit`
- `getEvent` → unchanged (returns the parent row; UI handles display)

Commit.

### Task 4: RecurrenceSelector component

Create `components/events/RecurrenceSelector.tsx`:

Presets: "Does not repeat" (default), "Every day", "Every week", "Every month", "Every year". Each generates an RRULE string:

- Daily: `FREQ=DAILY`
- Weekly: `FREQ=WEEKLY` (RRule auto-uses DTSTART's weekday — implicit BYDAY)
- Monthly: `FREQ=MONTHLY` (auto-uses DTSTART's day-of-month)
- Yearly: `FREQ=YEARLY`

Plus an optional "Until" date input (appends `;UNTIL=YYYYMMDDTHHMMSSZ`).

Props: `value: string | undefined`, `onChange: (rrule: string | undefined) => void`, `startDate: Date` (needed because the "Every Monday" label depends on the start date's weekday).

### Task 5: RecurrenceBadge component

Create `components/events/RecurrenceBadge.tsx` — pure display. Takes an RRULE string + start date, returns a human-readable label like "Repeats every Monday" or "Repeats every month until Dec 31, 2026".

Uses the same `rrule` package's `toText()` method when possible; falls back to manual mapping for our 4 presets.

### Task 6: Integrate into EventCreateForm

In `components/events/EventCreateForm.tsx`, add a RecurrenceSelector below the date inputs. State: `recurrenceRule: string | undefined`, defaults to `undefined`. On submit, pass to `createEvent({ ..., recurrenceRule })`.

`createEvent` mutation: add `recurrenceRule: v.optional(v.string())` to args; pass through to insert.

### Task 7: Show RecurrenceBadge on event detail

In `app/(app)/groups/[id]/events/[eid]/page.tsx`, add the badge below the title/time when `event.recurrenceRule !== undefined`.

### Task 8: E2E + README + final build

Minimal e2e: verify recurring event creates without error (auth-required, skips if no auth).

Update README plan roadmap. Run `npm run build`. Commit.

---

## Self-review

**PRD coverage**: §4.2 / §5.3 recurring events for daily/weekly/monthly/yearly with optional end date ✅. PRD §13.4 supported patterns: most basic ones in MVP; advanced ones (BYDAY-multi, BYSETPOS, after-N) deferred. PRD §13.3 edit-semantics: only "all events" mode in MVP; "only this event" + "this and following" → Plan 10.

**Risks**:
1. **`rrule` package may need Node** — if `import { RRule } from "rrule"` inside a Convex query fails (requires "use node" runtime), we'll have to make `expandOccurrences` an action and call it from queries — but queries can't call actions. Workaround: do expansion *client-side* in the calendar page, OR write minimal recurrence math inline (avoiding the library). I'll attempt the import inline first; fall back if needed.
2. **All-day recurring events** — RRULE math operates on UTC instants. If user creates "every Monday all-day in America/New_York", the expansion's instances will be ms-epoch values that represent midnight in NY. The existing EventTimeDisplay handles this via `eventTimezone`. Should "just work" but worth testing.
3. **Calendar grid only shows start date** — multi-day recurring events still only land on one cell. Plan 5 already noted this; same caveat applies.

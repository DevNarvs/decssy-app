# Plan 8: Find Free Day — Implementation Plan

> Yolo compact.

**Goal:** A user picks a group + date range + duration + time-of-day windows + subset of members → app returns time slots ranked by how many members are free.

**Algorithm (`findFreeSlots` query):**
1. Generate candidate slot starts every 30 min within the requested time-of-day windows across the date range (or 00:00 per date if all-day mode)
2. For each user in `includeUserIds`, materialize their busy intervals: all events they're attending/maybe/invited (not declined) in the range, with recurring events expanded via existing `expandOccurrences`
3. For each candidate slot, count users with NO overlap during [slotStart, slotStart + duration]
4. Sort by (`-freeCount`, `startUtc`); return top 20

**Files (delta):**
- `convex/findfree.ts` ← NEW (single query)
- `components/find/FindFreeForm.tsx` ← NEW
- `components/find/FreeSlotCard.tsx` ← NEW
- `app/(app)/find/page.tsx` ← REWRITTEN (replaces placeholder)
- `tests/e2e/find.spec.ts` ← NEW (unauthed redirect only)

**Out of scope:** "Create event from slot" multi-step wizard → simple pre-filled link suffices.

---

## Task 1: `findFreeSlots` query

Create `convex/findfree.ts` (full code):

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { expandOccurrences } from "./lib/recurrence";

const SLOT_GRANULARITY_MIN = 30;
const MAX_RESULTS = 20;

type TimeOfDay = "morning" | "afternoon" | "evening";

const WINDOWS: Record<TimeOfDay, { start: number; end: number }> = {
  morning: { start: 8, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 22 },
};

export const findFreeSlots = query({
  args: {
    groupId: v.id("groups"),
    rangeStart: v.number(),
    rangeEnd: v.number(),
    durationMinutes: v.number(), // 0 = all-day search
    timeOfDayFilters: v.array(
      v.union(
        v.literal("morning"),
        v.literal("afternoon"),
        v.literal("evening"),
      ),
    ),
    includeUserIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) return null;
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", callerId),
      )
      .unique();
    if (!membership) return null;

    if (args.includeUserIds.length === 0) return [];

    // Sanity: 1-year range max
    const MAX_RANGE_MS = 365 * 24 * 60 * 60 * 1000;
    if (args.rangeEnd - args.rangeStart > MAX_RANGE_MS) {
      throw new Error("Range too large — pick a window within 1 year");
    }

    // Build busy intervals per user.
    const busyByUser = new Map<string, Array<{ start: number; end: number }>>();
    for (const uid of args.includeUserIds) {
      busyByUser.set(uid.toString(), []);
    }

    // Collect attendee rows: filter to includeUserIds.
    const groupEvents = await ctx.db
      .query("events")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    for (const e of groupEvents) {
      if (e.deletedAt !== undefined) continue;
      const occurrences = expandOccurrences(e, args.rangeStart, args.rangeEnd);
      if (occurrences.length === 0) continue;

      // For each occurrence, mark every attendee (non-declined) busy.
      const attendees = await ctx.db
        .query("eventAttendees")
        .withIndex("by_event", (q) => q.eq("eventId", e._id))
        .collect();

      for (const a of attendees) {
        if (a.status === "declined") continue;
        const key = a.userId.toString();
        const list = busyByUser.get(key);
        if (!list) continue;
        for (const occ of occurrences) {
          list.push({ start: occ.startUtc, end: occ.endUtc });
        }
      }
    }

    // Sort each user's busy list.
    for (const list of busyByUser.values()) {
      list.sort((a, b) => a.start - b.start);
    }

    // Generate candidate slots.
    const candidates: Array<{ start: number; end: number }> = [];
    const durationMs =
      args.durationMinutes === 0
        ? 24 * 60 * 60 * 1000
        : args.durationMinutes * 60 * 1000;

    const granMs = SLOT_GRANULARITY_MIN * 60 * 1000;
    let dayCursor = new Date(args.rangeStart);
    dayCursor.setHours(0, 0, 0, 0);

    while (dayCursor.getTime() < args.rangeEnd) {
      if (args.durationMinutes === 0) {
        // All-day: one candidate per date.
        candidates.push({
          start: dayCursor.getTime(),
          end: dayCursor.getTime() + durationMs,
        });
      } else {
        // Honor time-of-day windows.
        for (const tod of args.timeOfDayFilters) {
          const win = WINDOWS[tod];
          for (
            let h = win.start;
            h <= win.end - args.durationMinutes / 60;
            h += SLOT_GRANULARITY_MIN / 60
          ) {
            const slot = new Date(dayCursor);
            slot.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
            const slotStart = slot.getTime();
            if (slotStart < args.rangeStart || slotStart >= args.rangeEnd) continue;
            candidates.push({ start: slotStart, end: slotStart + durationMs });
          }
        }
      }
      dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000);
    }

    // Score each candidate.
    const scored: Array<{
      start: number;
      end: number;
      freeCount: number;
      busyUserIds: Id<"users">[];
    }> = [];

    for (const c of candidates) {
      const busyUserIds: Id<"users">[] = [];
      for (const uid of args.includeUserIds) {
        const list = busyByUser.get(uid.toString()) ?? [];
        const conflict = list.some(
          (b) => b.start < c.end && b.end > c.start,
        );
        if (conflict) busyUserIds.push(uid);
      }
      scored.push({
        start: c.start,
        end: c.end,
        freeCount: args.includeUserIds.length - busyUserIds.length,
        busyUserIds,
      });
    }

    // Sort: most free first, then earliest.
    scored.sort((a, b) => {
      if (b.freeCount !== a.freeCount) return b.freeCount - a.freeCount;
      return a.start - b.start;
    });

    // Hydrate busyUserIds → names.
    const top = scored.slice(0, MAX_RESULTS);
    const userById = new Map<string, Doc<"users">>();
    for (const uid of args.includeUserIds) {
      const u = await ctx.db.get(uid);
      if (u) userById.set(uid.toString(), u);
    }

    return top.map((s) => ({
      start: s.start,
      end: s.end,
      freeCount: s.freeCount,
      totalCount: args.includeUserIds.length,
      busyNames: s.busyUserIds.map(
        (uid) =>
          userById.get(uid.toString())?.name ??
          userById.get(uid.toString())?.email ??
          "Anonymous",
      ),
    }));
  },
});
```

## Task 2: `FindFreeForm` + `FreeSlotCard` components + /find page

Standard form patterns. Use Plan 2 ColorPicker-style aesthetic. /find page wires the form to the query and renders results.

## Task 3: README + tests + build

E2E: unauthed /find → redirect. README mark Plan 8 done.

---

## Self-review

- **PRD §5.5 + §11 covered**: group selector, date range, duration (incl. all-day), time-of-day filters, include subset of members, top-20 ranked results with `freeCount/totalCount` and partial-availability flag. ✅
- **Out of scope (deferred per PRD §17.2)**: "Create event from slot" → simple pre-filled link CTA in card; multi-step wizard later.
- **Risks**: O(candidates × users × busy-events) compute. Mitigated by 1-year range cap + 30-min granularity + 20-result limit. PRD §11.3 expects <500ms for 5-user × 30-day; this should hit it.

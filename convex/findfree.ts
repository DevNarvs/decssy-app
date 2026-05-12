/**
 * Find Free Day — search for time slots where a chosen subset of group
 * members are all (or mostly) free.
 *
 * Algorithm:
 * 1. Generate candidate slot start times every 30 min within the
 *    requested time-of-day windows across the date range. All-day mode
 *    generates one candidate per date.
 * 2. For each member in `includeUserIds`, materialize their busy intervals
 *    from events they're attending/maybe/invited to (recurring expanded).
 * 3. For each candidate, count members with no overlap during the slot.
 * 4. Sort by (freeCount desc, startUtc asc), return top 20.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { expandOccurrences } from "./lib/recurrence";

const SLOT_GRANULARITY_MIN = 30;
const MAX_RESULTS = 20;
const MAX_RANGE_MS = 365 * 24 * 60 * 60 * 1000;

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
    if (args.rangeEnd - args.rangeStart > MAX_RANGE_MS) {
      throw new Error("Range too large — pick a window within 1 year");
    }
    if (args.rangeEnd <= args.rangeStart) {
      throw new Error("End must be after start");
    }

    // Step 1: build busy intervals per user.
    const busyByUser = new Map<string, Array<{ start: number; end: number }>>();
    for (const uid of args.includeUserIds) busyByUser.set(uid.toString(), []);

    const groupEvents = await ctx.db
      .query("events")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    for (const e of groupEvents) {
      if (e.deletedAt !== undefined) continue;
      const occurrences = expandOccurrences(e, args.rangeStart, args.rangeEnd);
      if (occurrences.length === 0) continue;

      const attendees = await ctx.db
        .query("eventAttendees")
        .withIndex("by_event", (q) => q.eq("eventId", e._id))
        .collect();

      for (const a of attendees) {
        if (a.status === "declined") continue;
        const list = busyByUser.get(a.userId.toString());
        if (!list) continue;
        for (const occ of occurrences) {
          list.push({ start: occ.startUtc, end: occ.endUtc });
        }
      }
    }

    // Step 2: candidate slot generation.
    const candidates: Array<{ start: number; end: number }> = [];
    const durationMs =
      args.durationMinutes === 0
        ? 24 * 60 * 60 * 1000
        : args.durationMinutes * 60 * 1000;

    let dayCursor = new Date(args.rangeStart);
    dayCursor.setHours(0, 0, 0, 0);

    while (dayCursor.getTime() < args.rangeEnd) {
      if (args.durationMinutes === 0) {
        candidates.push({
          start: dayCursor.getTime(),
          end: dayCursor.getTime() + durationMs,
        });
      } else {
        for (const tod of args.timeOfDayFilters) {
          const win = WINDOWS[tod];
          // 30-min steps; slot must fit within window.
          for (
            let h = win.start;
            h + args.durationMinutes / 60 <= win.end;
            h += SLOT_GRANULARITY_MIN / 60
          ) {
            const slot = new Date(dayCursor);
            slot.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
            const slotStart = slot.getTime();
            if (slotStart < args.rangeStart) continue;
            if (slotStart >= args.rangeEnd) continue;
            candidates.push({ start: slotStart, end: slotStart + durationMs });
          }
        }
      }
      dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000);
    }

    // Step 3: score each candidate.
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

    scored.sort((a, b) => {
      if (b.freeCount !== a.freeCount) return b.freeCount - a.freeCount;
      return a.start - b.start;
    });

    // Step 4: hydrate names for the top results.
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

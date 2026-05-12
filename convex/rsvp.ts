/**
 * RSVP mutation — change your own attendance status on an event.
 * Validates that the caller is on the event's invite list.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAttendance } from "./lib/permissions";

export const setRsvp = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("attending"),
      v.literal("maybe"),
      v.literal("declined"),
    ),
  },
  handler: async (ctx, { eventId, status }) => {
    const me = await getAttendance(ctx, eventId);
    if (!me) throw new Error("You're not on this event's invite list");

    const row = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", eventId).eq("userId", me.userId),
      )
      .unique();
    if (!row) throw new Error("Attendance row missing");

    await ctx.db.patch(row._id, { status, respondedAt: Date.now() });
  },
});

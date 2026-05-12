/**
 * Event comments: add (member-only), delete (author-only).
 * Reads happen via convex/events.ts → getEvent.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAttendance, requireUser } from "./lib/permissions";
import { createNotification } from "./notifications";

const MAX_BODY = 1000;

export const addComment = mutation({
  args: { eventId: v.id("events"), body: v.string() },
  handler: async (ctx, { eventId, body }) => {
    const me = await getAttendance(ctx, eventId);
    if (!me) {
      throw new Error("You can only comment on events you're invited to");
    }
    const trimmed = body.trim();
    if (trimmed.length < 1) throw new Error("Empty comment");
    if (trimmed.length > MAX_BODY) {
      throw new Error(`Comment max ${MAX_BODY} characters`);
    }
    await ctx.db.insert("eventComments", {
      eventId,
      userId: me.userId,
      body: trimmed,
      createdAt: Date.now(),
    });

    // Notify all event attendees except the commenter.
    const event = await ctx.db.get(eventId);
    if (!event) return;
    const actor = await ctx.db.get(me.userId);
    const actorName = actor?.name ?? actor?.email ?? "Someone";
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const preview = trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed;
    for (const a of attendees) {
      if (a.userId === me.userId) continue;
      if (a.status === "declined") continue;
      await createNotification(ctx, {
        userId: a.userId,
        type: "comment_added",
        groupId: event.groupId,
        eventId,
        actorName,
        actorUserId: me.userId,
        message: `${actorName} on "${event.title}": "${preview}"`,
      });
    }
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("eventComments") },
  handler: async (ctx, { commentId }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(commentId);
    if (!c || c.deletedAt !== undefined) return; // idempotent
    if (c.userId !== userId) {
      throw new Error("Only the comment author can delete it");
    }
    await ctx.db.patch(commentId, { deletedAt: Date.now() });
  },
});

/**
 * Notification queries + mutations + a server-side `createNotification`
 * helper for other mutations to call.
 */
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

type NotificationType =
  | "event_invite"
  | "event_updated"
  | "event_cancelled"
  | "comment_added"
  | "invite_accepted"
  | "ownership_transferred";

interface CreateArgs {
  userId: Id<"users">;
  type: NotificationType;
  groupId?: Id<"groups">;
  eventId?: Id<"events">;
  actorName: string;
  actorUserId?: Id<"users">;
  message: string;
}

/**
 * Insert a notification row. Skips no-op cases (recipient = actor).
 */
export async function createNotification(
  ctx: MutationCtx,
  args: CreateArgs,
): Promise<void> {
  if (args.actorUserId && args.actorUserId === args.userId) return;
  await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    groupId: args.groupId,
    eventId: args.eventId,
    actorName: args.actorName,
    actorUserId: args.actorUserId,
    message: args.message,
    createdAt: Date.now(),
  });
}

/** Reactive feed for the inbox. Returns last 50 newest-first. */
export const listMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return rows;
  },
});

/** Reactive unread count for the nav badge. Returns 0 if not signed in. */
export const countUnread = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return 0;
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_unread", (q) =>
        q.eq("userId", userId).eq("readAt", undefined),
      )
      .collect();
    return rows.length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId || row.readAt !== undefined) return;
    await ctx.db.patch(id, { readAt: Date.now() });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const now = Date.now();
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_unread", (q) =>
        q.eq("userId", userId).eq("readAt", undefined),
      )
      .collect();
    for (const r of rows) {
      await ctx.db.patch(r._id, { readAt: now });
    }
  },
});

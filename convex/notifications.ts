/**
 * Notification queries + mutations + a server-side `createNotification`
 * helper for other mutations to call.
 */
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireMember } from "./lib/permissions";

type NotificationType =
  | "event_invite"
  | "event_updated"
  | "event_cancelled"
  | "comment_added"
  | "invite_accepted"
  | "ownership_transferred"
  | "event_reminder";

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
 * Insert a notification row. Skips two cases:
 *   1. recipient == actor (no-op self-notification)
 *   2. the recipient has muted the notification's group — suppresses BOTH
 *      the in-app notification and (since the email cron reads the same
 *      table) the email. This is the per-group mute lever; see
 *      setGroupMuted below. Notifications with no groupId (rare) are never
 *      mutable and always delivered.
 */
export async function createNotification(
  ctx: MutationCtx,
  args: CreateArgs,
): Promise<void> {
  if (args.actorUserId && args.actorUserId === args.userId) return;

  if (args.groupId) {
    const mute = await ctx.db
      .query("notificationMutes")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", args.userId).eq("groupId", args.groupId!),
      )
      .unique();
    if (mute) return; // recipient muted this group
  }

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

  // Fan out a Web Push too — only for users who subscribed (the action loads
  // their subscriptions and no-ops if none). Placed AFTER the self/mute guards
  // so push inherits them. Skip comment_added (high-noise; mirrors its email-
  // off-by-default policy) to avoid spamming the lock screen.
  if (args.type !== "comment_added") {
    const url =
      args.eventId && args.groupId
        ? `/groups/${args.groupId}/events/${args.eventId}`
        : args.groupId
          ? `/groups/${args.groupId}`
          : "/inbox";
    await ctx.scheduler.runAfter(0, internal.pushNode.sendPush, {
      userId: args.userId,
      title: "Decssy",
      body: args.message,
      url,
    });
  }
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

/**
 * Whether the current user has muted a given group's notifications.
 * Returns false if not signed in (defensive; the UI is auth-gated).
 */
export const isGroupMuted = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const mute = await ctx.db
      .query("notificationMutes")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", userId).eq("groupId", groupId),
      )
      .unique();
    return mute !== null;
  },
});

/**
 * Toggle the current user's mute for a group. Membership-gated — you can
 * only mute a group you're in. Idempotent in both directions.
 */
export const setGroupMuted = mutation({
  args: { groupId: v.id("groups"), muted: v.boolean() },
  handler: async (ctx, { groupId, muted }) => {
    const userId = await requireMember(ctx, groupId);
    const existing = await ctx.db
      .query("notificationMutes")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", userId).eq("groupId", groupId),
      )
      .unique();

    if (muted && !existing) {
      await ctx.db.insert("notificationMutes", {
        userId,
        groupId,
        createdAt: Date.now(),
      });
    } else if (!muted && existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

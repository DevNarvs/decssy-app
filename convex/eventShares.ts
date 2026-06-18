/**
 * Per-event share tokens — share ONE event with a person who can RSVP
 * without joining any group.
 *
 * Contrast with groupInvites (convex/invites.ts): accepting a group invite
 * creates a groupMembers row (full group access); accepting an event share
 * creates only an eventAttendees row for that single event. The recipient
 * never sees the group, the group's other events, or the group roster.
 *
 * Public (no auth): getEventSharePreview — used by /e/[token] before sign-in.
 * Auth required: ensureEventShare (creator), acceptEventShare, revokeEventShare.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/permissions";
import { generateInviteToken } from "./lib/tokens";

const DEFAULT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Event-creator only: return an active share token for the event, creating
 * one if none exists. Idempotent reuse keeps a stable link across re-opens
 * of the share dialog.
 */
export const ensureEventShare = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const userId = await requireUser(ctx);
    const event = await ctx.db.get(eventId);
    if (!event || event.deletedAt !== undefined) {
      throw new Error("Event not found");
    }
    if (event.createdBy !== userId) {
      throw new Error("Only the event's creator can share it");
    }

    // Per-event sharing is for PERSONAL events only. Group events have a
    // roster, and the right way to bring someone into one is a group invite
    // (they join and see the group). Restricting the mint here keeps the
    // guest model to events that have no roster to leak, and matches the
    // product scope ("share the sched, not the group, if it's personal").
    const group = await ctx.db.get(event.groupId);
    if (group?.isPersonalDefault !== true) {
      throw new Error(
        "Only personal events can be shared this way — for a group event, invite people to the group instead.",
      );
    }

    const now = Date.now();
    const active = (
      await ctx.db
        .query("eventShares")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect()
    )
      .filter((s) => s.revokedAt === undefined && s.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (active.length > 0 && active[0]) return active[0].token;

    const shareId = await ctx.db.insert("eventShares", {
      eventId,
      token: generateInviteToken(),
      createdBy: userId,
      createdAt: now,
      expiresAt: now + DEFAULT_EXPIRY_MS,
    });
    const created = await ctx.db.get(shareId);
    return created!.token;
  },
});

/**
 * PUBLIC — no auth. Used by /e/[token] to show "X invited you to <event>"
 * before the visitor signs in. Returns minimal event info; deliberately
 * leaks NO group identity (no group name, color, roster, or other events).
 * Returns null for invalid/revoked/expired tokens or deleted events.
 */
export const getEventSharePreview = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const share = await ctx.db
      .query("eventShares")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!share) return null;
    if (share.revokedAt !== undefined) return null;
    if (share.expiresAt <= Date.now()) return null;

    const event = await ctx.db.get(share.eventId);
    if (!event || event.deletedAt !== undefined) return null;

    const creator = await ctx.db.get(event.createdBy);

    return {
      eventTitle: event.title,
      startUtc: event.startUtc,
      endUtc: event.endUtc,
      isAllDay: event.isAllDay,
      eventTimezone: event.eventTimezone,
      sharerName: creator?.name ?? creator?.email ?? "Someone",
      // NO group fields — by design.
    };
  },
});

/**
 * Auth required: signed-in user accepts an event share by token.
 *
 * Creates an eventAttendees row (status "invited") if they don't already
 * have one — granting RSVP + calendar access to this single event. Does
 * NOT create any group membership.
 *
 * Idempotent: existing attendee row (group member, or accepted before) is
 * returned without a second insert. Throws for invalid/expired/revoked
 * tokens or deleted events.
 */
export const acceptEventShare = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireUser(ctx);

    const share = await ctx.db
      .query("eventShares")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!share) throw new Error("Invalid share link");
    if (share.revokedAt !== undefined) throw new Error("This share link was revoked");
    if (share.expiresAt <= Date.now()) throw new Error("This share link has expired");

    const event = await ctx.db.get(share.eventId);
    if (!event || event.deletedAt !== undefined) {
      throw new Error("This event no longer exists");
    }

    const creator = await ctx.db.get(event.createdBy);
    const sharerName = creator?.name ?? creator?.email ?? "Someone";
    const isCreator = event.createdBy === userId;

    const existing = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", share.eventId).eq("userId", userId),
      )
      .unique();
    if (existing) {
      return {
        eventId: share.eventId,
        groupId: event.groupId,
        eventTitle: event.title,
        sharerName,
        wasAlready: true,
        isCreator,
      };
    }

    await ctx.db.insert("eventAttendees", {
      eventId: share.eventId,
      userId,
      status: "invited",
      respondedAt: undefined,
    });

    return {
      eventId: share.eventId,
      groupId: event.groupId,
      eventTitle: event.title,
      sharerName,
      wasAlready: false,
      isCreator,
    };
  },
});

/**
 * Event-creator only: soft-revoke a share token. The link becomes invalid;
 * existing recipients keep their attendee row (revoking the link doesn't
 * retroactively kick people — that would be a separate "remove guest"
 * action). Idempotent.
 */
export const revokeEventShare = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireUser(ctx);
    const share = await ctx.db
      .query("eventShares")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!share) return;
    const event = await ctx.db.get(share.eventId);
    if (!event || event.createdBy !== userId) {
      throw new Error("Only the event's creator can revoke its share link");
    }
    if (share.revokedAt !== undefined) return;
    await ctx.db.patch(share._id, { revokedAt: Date.now() });
  },
});

// Note: there's no separate "list event guests" query in this MVP — the
// event detail page already shows attendees via events.getEvent, which
// includes anyone who accepted a share. Add one here if a dedicated
// guest-management UI is needed later.

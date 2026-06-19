/**
 * Self-service account deletion (GDPR Art. 17 / App Store 5.1.1(v) / Play).
 *
 * Hard-deletes the signed-in user, their @convex-dev/auth rows, and cascades
 * their app data in one atomic mutation (a Convex mutation is a single
 * transaction — the whole cascade commits or rolls back together).
 *
 * Owned-groups policy (mirrors the existing transferOwnership heir rule):
 *   - personal "Just me" group, or a group where they're the only member →
 *     full cascade-delete (events → attendees/comments/shares/reminders,
 *     invites, members, the group).
 *   - owned group with OTHER members → auto-transfer ownership to the
 *     longest-tenured remaining member; the group survives. We never block
 *     the deletion on other users' presence (legally it must always succeed).
 *
 * There is no library helper to delete a Convex Auth user, so we delete the
 * auth rows ourselves: authVerificationCodes (per account) → authAccounts →
 * authRefreshTokens (per session) → authSessions → the users row last.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { createNotification } from "./notifications";

/** Delete one event and everything hanging off it. Idempotent. */
async function cascadeDeleteEvent(ctx: MutationCtx, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (!event) return;
  for (const a of await ctx.db
    .query("eventAttendees")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect()) {
    await ctx.db.delete(a._id);
  }
  for (const c of await ctx.db
    .query("eventComments")
    .withIndex("by_event_and_created", (q) => q.eq("eventId", eventId))
    .collect()) {
    await ctx.db.delete(c._id);
  }
  for (const s of await ctx.db
    .query("eventShares")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect()) {
    await ctx.db.delete(s._id);
  }
  for (const r of await ctx.db
    .query("eventReminders")
    .withIndex("by_dedup", (q) => q.eq("eventId", eventId))
    .collect()) {
    await ctx.db.delete(r._id);
  }
  await ctx.db.delete(eventId);
}

/** Delete a whole group and all its content. */
async function cascadeDeleteGroup(ctx: MutationCtx, groupId: Id<"groups">) {
  for (const e of await ctx.db
    .query("events")
    .withIndex("by_group", (q) => q.eq("groupId", groupId))
    .collect()) {
    await cascadeDeleteEvent(ctx, e._id);
  }
  for (const m of await ctx.db
    .query("groupMembers")
    .withIndex("by_group", (q) => q.eq("groupId", groupId))
    .collect()) {
    await ctx.db.delete(m._id);
  }
  for (const i of await ctx.db
    .query("groupInvites")
    .withIndex("by_group", (q) => q.eq("groupId", groupId))
    .collect()) {
    await ctx.db.delete(i._id);
  }
  await ctx.db.delete(groupId);
}

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    // ── 1. Owned groups: transfer (if others remain) or cascade-delete ────
    const ownedGroups = await ctx.db
      .query("groups")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    for (const g of ownedGroups) {
      const members = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", g._id))
        .collect();
      const others = members.filter((m) => m.userId !== userId);
      if (g.isPersonalDefault || others.length === 0) {
        await cascadeDeleteGroup(ctx, g._id);
      } else {
        // Longest-tenured remaining member inherits (matches getGroup's sort).
        others.sort((a, b) => a.joinedAt - b.joinedAt);
        const heir = others[0]!.userId;
        await ctx.db.patch(g._id, { ownerId: heir });
        await createNotification(ctx, {
          userId: heir,
          type: "ownership_transferred",
          groupId: g._id,
          actorName: "A departing member",
          // No actorUserId — the actor is being deleted.
          message: `You're now the owner of "${g.name}" (the previous owner deleted their account)`,
        });
      }
    }

    // ── 2. Events the user created in groups they do NOT own → delete ─────
    // (owned-group events were already removed above; cascadeDeleteEvent is
    // idempotent, so any overlap is a safe no-op.)
    for (const e of await ctx.db
      .query("events")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect()) {
      await cascadeDeleteEvent(ctx, e._id);
    }

    // ── 3. The user's own rows scattered across other groups ─────────────
    for (const a of await ctx.db
      .query("eventAttendees")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()) {
      await ctx.db.delete(a._id);
    }
    for (const c of await ctx.db
      .query("eventComments")
      .withIndex("by_author", (q) => q.eq("userId", userId))
      .collect()) {
      await ctx.db.delete(c._id);
    }
    for (const m of await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()) {
      await ctx.db.delete(m._id);
    }
    for (const mute of await ctx.db
      .query("notificationMutes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()) {
      await ctx.db.delete(mute._id);
    }
    for (const n of await ctx.db
      .query("notifications")
      .withIndex("by_user_and_created", (q) => q.eq("userId", userId))
      .collect()) {
      await ctx.db.delete(n._id);
    }

    // ── 4. Convex Auth rows (children before parents) ────────────────────
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const acc of accounts) {
      for (const code of await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", acc._id))
        .collect()) {
        await ctx.db.delete(code._id);
      }
      await ctx.db.delete(acc._id);
    }
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const s of sessions) {
      for (const rt of await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
        .collect()) {
        await ctx.db.delete(rt._id);
      }
      await ctx.db.delete(s._id);
    }

    // ── 5. The user row, last ────────────────────────────────────────────
    await ctx.db.delete(userId);
  },
});

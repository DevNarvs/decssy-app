/**
 * Group invite queries and mutations.
 *
 * Public query (no auth): getInvitePreview — used by /join/[token] before
 * sign-in. Returns minimal group info or null for invalid/expired tokens.
 *
 * Auth required: createInvite, acceptInvite, listGroupInvites, revokeInvite.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwner, requireUser } from "./lib/permissions";
import { generateInviteToken } from "./lib/tokens";
import { createNotification } from "./notifications";

const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ACTIVE_INVITES_PER_GROUP = 5;

/**
 * Owner-only: create a new invite token for the group.
 * Caps active invites per group at 5 to keep the dashboard manageable.
 */
export const createInvite = mutation({
  args: {
    groupId: v.id("groups"),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, { groupId, maxUses }) => {
    const userId = await requireOwner(ctx, groupId);

    // Personal default groups ("My Schedule") are single-user by design —
    // their entire point is private scheduling. Block invite creation on
    // the server so direct URL navigation can't bypass the hidden UI.
    const group = await ctx.db.get(groupId);
    if (group?.isPersonalDefault === true) {
      throw new Error(
        "This is your personal schedule — create a new group to invite people.",
      );
    }

    const now = Date.now();
    const all = await ctx.db
      .query("groupInvites")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    const activeCount = all.filter(
      (i) => i.revokedAt === undefined && i.expiresAt > now,
    ).length;
    if (activeCount >= MAX_ACTIVE_INVITES_PER_GROUP) {
      throw new Error(
        `Max ${MAX_ACTIVE_INVITES_PER_GROUP} active invites per group — revoke an old one first.`,
      );
    }

    if (maxUses !== undefined && maxUses < 1) {
      throw new Error("maxUses must be at least 1 or omitted for unlimited");
    }

    const inviteId = await ctx.db.insert("groupInvites", {
      groupId,
      token: generateInviteToken(),
      createdBy: userId,
      createdAt: now,
      expiresAt: now + DEFAULT_EXPIRY_MS,
      maxUses,
      usedCount: 0,
    });

    return inviteId;
  },
});

/**
 * Owner-only: soft-revoke an invite. The token becomes immediately invalid;
 * the row stays in the DB for audit (Plan 9 audit log will read it).
 */
export const revokeInvite = mutation({
  args: { inviteId: v.id("groupInvites") },
  handler: async (ctx, { inviteId }) => {
    const userId = await requireUser(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error("Invite not found");
    const group = await ctx.db.get(invite.groupId);
    if (!group || group.ownerId !== userId) {
      throw new Error("Only the group owner can revoke invites");
    }
    if (invite.revokedAt !== undefined) return; // idempotent
    await ctx.db.patch(inviteId, { revokedAt: Date.now() });
  },
});

/**
 * Owner-only list of a group's active invites. Returns null if the caller
 * isn't the group owner (consistent with getGroup's null-on-no-access).
 */
export const listGroupInvites = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const group = await ctx.db.get(groupId);
    if (!group || group.ownerId !== userId) return null;

    const now = Date.now();
    const all = await ctx.db
      .query("groupInvites")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    return all
      .filter((i) => i.revokedAt === undefined && i.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * PUBLIC query — no auth required. Used by the /join/[token] landing page
 * to show "you've been invited to <Group>" before the visitor signs up.
 *
 * Returns minimal info. Does NOT leak member roster or any private data.
 * Returns null for invalid/revoked/expired/use-reached tokens.
 */
export const getInvitePreview = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query("groupInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite) return null;
    if (invite.revokedAt !== undefined) return null;
    if (invite.expiresAt <= Date.now()) return null;
    if (invite.maxUses !== undefined && invite.usedCount >= invite.maxUses) {
      return null;
    }

    const group = await ctx.db.get(invite.groupId);
    if (!group) return null;

    const owner = await ctx.db.get(group.ownerId);

    const memberCount = (
      await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", invite.groupId))
        .collect()
    ).length;

    return {
      groupName: group.name,
      groupColor: group.color,
      groupDescription: group.description,
      memberCount,
      ownerName: owner?.name ?? owner?.email ?? "Someone",
      expiresAt: invite.expiresAt,
    };
  },
});

/**
 * Auth required: signed-in user accepts an invite by token.
 *
 * Returns the joined group's _id on success.
 *
 * Idempotent: already a member? Returns the group id without incrementing
 * usedCount. Throws for invalid/expired/revoked/use-reached tokens.
 */
export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireUser(ctx);

    const invite = await ctx.db
      .query("groupInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite) throw new Error("Invalid invite link");
    if (invite.revokedAt !== undefined) throw new Error("This invite was revoked");
    if (invite.expiresAt <= Date.now()) throw new Error("This invite has expired");
    if (invite.maxUses !== undefined && invite.usedCount >= invite.maxUses) {
      throw new Error("This invite has reached its use limit");
    }

    const group = await ctx.db.get(invite.groupId);
    if (!group) throw new Error("The group for this invite no longer exists");

    // Idempotent: already a member?
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", invite.groupId).eq("userId", userId),
      )
      .unique();
    if (existing) return invite.groupId;

    await ctx.db.insert("groupMembers", {
      groupId: invite.groupId,
      userId,
      joinedAt: Date.now(),
    });

    await ctx.db.patch(invite._id, { usedCount: invite.usedCount + 1 });

    // Notify the group owner that a new member joined.
    const me = await ctx.db.get(userId);
    const actorName = me?.name ?? me?.email ?? "Someone";
    await createNotification(ctx, {
      userId: group.ownerId,
      type: "invite_accepted",
      groupId: invite.groupId,
      actorName,
      actorUserId: userId,
      message: `${actorName} joined "${group.name}"`,
    });

    return invite.groupId;
  },
});

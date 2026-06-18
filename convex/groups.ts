/**
 * Group-related queries and mutations.
 * Permission checks delegate to convex/lib/permissions.ts.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { isValidGroupColor } from "./lib/groupColors";
import {
  requireUser,
  requireMember,
  requireOwner,
} from "./lib/permissions";
import { createNotification } from "./notifications";

const NAME_MIN = 1;
const NAME_MAX = 50;
const DESCRIPTION_MAX = 280;

/**
 * Create a new group with the caller as owner + first member.
 * Returns the new group's id.
 */
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
  },
  handler: async (ctx, { name, description, color }) => {
    const userId = await requireUser(ctx);

    const trimmedName = name.trim();
    if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
      throw new Error(`Name must be ${NAME_MIN}–${NAME_MAX} characters`);
    }
    if (description !== undefined && description.length > DESCRIPTION_MAX) {
      throw new Error(`Description max ${DESCRIPTION_MAX} characters`);
    }
    if (!isValidGroupColor(color)) {
      throw new Error("Invalid color — must be one of the 8 palette values");
    }

    const groupId = await ctx.db.insert("groups", {
      name: trimmedName,
      description: description?.trim() || undefined,
      color,
      ownerId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      joinedAt: Date.now(),
    });

    return groupId;
  },
});

/**
 * Returns the *social* groups the caller is a member of, with member counts.
 * Sorted by createdAt descending (most recently created first).
 *
 * Excludes the auto-created personal-default group ("My Schedule") — that's
 * a solo storage container for personal events, not a social group, so it
 * has no place in the /groups list or the calendar filter chips. Surface it
 * via `getPersonalGroup` instead. (This is what makes the personal schedule
 * stop masquerading as a group and resolves the duplicate "My Schedule"
 * confusion when a real social group happens to share that name.)
 */
export const listMyGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const results: Array<{
      group: Doc<"groups">;
      memberCount: number;
      isOwner: boolean;
    }> = [];

    for (const m of memberships) {
      const group = await ctx.db.get(m.groupId);
      if (!group) continue;
      if (group.isPersonalDefault === true) continue; // personal space, not a social group
      const memberCount = (
        await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect()
      ).length;
      results.push({
        group,
        memberCount,
        isOwner: group.ownerId === userId,
      });
    }

    results.sort((a, b) => b.group.createdAt - a.group.createdAt);

    return results;
  },
});

/**
 * Returns the caller's auto-created personal-default group ("My Schedule"),
 * or null if they don't have one yet (ensurePersonalGroup creates it on
 * first calendar visit). Used by the create-event FAB to offer a "Just me"
 * destination distinct from the social group cards.
 */
export const getPersonalGroup = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const owned = await ctx.db
      .query("groups")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    return owned.find((g) => g.isPersonalDefault === true) ?? null;
  },
});

/**
 * Returns full group detail including hydrated members, OR null if the
 * caller isn't a member / the group is gone.
 *
 * Returning null (rather than throwing) is critical for the "delete a group
 * I'm viewing" UX: after the delete mutation fires, this reactive query
 * re-runs and finds itself unauthorized — without the null path it would
 * crash the page with "Not a member of this group" before the navigation
 * to /groups completes. Same protection applies when an owner removes you
 * from a group while you have it open.
 */
export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId),
      )
      .unique();
    if (!membership) return null;

    const group = await ctx.db.get(groupId);
    if (!group) return null;

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const members: Array<{
      userId: Id<"users">;
      name: string;
      email: string;
      joinedAt: number;
      isOwner: boolean;
      isYou: boolean;
    }> = [];
    for (const m of memberships) {
      const u = await ctx.db.get(m.userId);
      if (!u) continue;
      members.push({
        userId: m.userId,
        name: u.name ?? u.email ?? "Anonymous",
        email: u.email ?? "",
        joinedAt: m.joinedAt,
        isOwner: m.userId === group.ownerId,
        isYou: m.userId === userId,
      });
    }
    // Owner first, then by joinedAt ascending (oldest member first).
    members.sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return a.joinedAt - b.joinedAt;
    });

    return {
      group,
      members,
      isOwner: group.ownerId === userId,
    };
  },
});

/**
 * Owner-only edit of name / description / color. Any subset of args is allowed.
 */
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { groupId, name, description, color }) => {
    await requireOwner(ctx, groupId);

    const patch: { name?: string; description?: string; color?: string } = {};

    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
        throw new Error(`Name must be ${NAME_MIN}–${NAME_MAX} characters`);
      }
      patch.name = trimmed;
    }
    if (description !== undefined) {
      if (description.length > DESCRIPTION_MAX) {
        throw new Error(`Description max ${DESCRIPTION_MAX} characters`);
      }
      patch.description = description.trim() || undefined;
    }
    if (color !== undefined) {
      if (!isValidGroupColor(color)) {
        throw new Error("Invalid color");
      }
      patch.color = color;
    }

    await ctx.db.patch(groupId, patch);
  },
});

/**
 * Non-owner leaves a group. Owner cannot leave — they must delete the group
 * or (in Plan 3) transfer ownership first.
 */
export const leaveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await requireMember(ctx, groupId);
    const group = await ctx.db.get(groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    if (group.ownerId === userId) {
      throw new Error(
        "Owners can't leave — delete the group or transfer ownership first",
      );
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId),
      )
      .unique();
    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

/**
 * Owner-only deletion. Cascades to groupMembers AND groupInvites.
 * Future plans (events, comments) MUST extend this cascade.
 */
export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await requireOwner(ctx, groupId);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }

    // Plan 3: cascade-delete invites for the group.
    const invites = await ctx.db
      .query("groupInvites")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    for (const i of invites) {
      await ctx.db.delete(i._id);
    }

    // Plan 4: cascade-delete events + their attendees + comments.
    const events = await ctx.db
      .query("events")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    for (const e of events) {
      const attendees = await ctx.db
        .query("eventAttendees")
        .withIndex("by_event", (q) => q.eq("eventId", e._id))
        .collect();
      for (const a of attendees) await ctx.db.delete(a._id);
      const comments = await ctx.db
        .query("eventComments")
        .withIndex("by_event_and_created", (q) => q.eq("eventId", e._id))
        .collect();
      for (const c of comments) await ctx.db.delete(c._id);
      await ctx.db.delete(e._id);
    }

    await ctx.db.delete(groupId);
  },
});

/**
 * Owner-only: hand over ownership to another member of the group.
 *
 * The new owner must already be a member. After transfer, the previous
 * owner remains a regular member (does NOT auto-leave).
 *
 * Plan 9 will add an audit log entry here.
 */
export const transferOwnership = mutation({
  args: {
    groupId: v.id("groups"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, { groupId, newOwnerId }) => {
    const currentOwnerId = await requireOwner(ctx, groupId);
    if (newOwnerId === currentOwnerId) {
      throw new Error("You're already the owner");
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", groupId).eq("userId", newOwnerId),
      )
      .unique();
    if (!membership) {
      throw new Error("The chosen person is not a member of this group");
    }

    await ctx.db.patch(groupId, { ownerId: newOwnerId });

    // Notify the new owner.
    const group = await ctx.db.get(groupId);
    const actor = await ctx.db.get(currentOwnerId);
    const actorName = actor?.name ?? actor?.email ?? "Someone";
    if (group) {
      await createNotification(ctx, {
        userId: newOwnerId,
        type: "ownership_transferred",
        groupId,
        actorName,
        actorUserId: currentOwnerId,
        message: `${actorName} made you the owner of "${group.name}"`,
      });
    }
  },
});

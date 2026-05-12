/**
 * Shared permission checks used across group/event/comment mutations.
 *
 * - `requireUser(ctx)` — returns the current user's _id, throws if unauthed
 * - `requireMember(ctx, groupId)` — additionally throws if not in the group
 * - `requireOwner(ctx, groupId)` — additionally throws if not the group owner
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Resolves the caller's attendance row for an event, or null if either
 * they're not signed in or they're not on the event's invite list.
 * Used by setRsvp, addComment, and read-side event permission checks.
 */
export async function getAttendance(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
): Promise<{ userId: Id<"users">; status: string } | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const row = await ctx.db
    .query("eventAttendees")
    .withIndex("by_event_and_user", (q) =>
      q.eq("eventId", eventId).eq("userId", userId),
    )
    .unique();
  return row ? { userId, status: row.status } : null;
}

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not signed in");
  }
  return userId;
}

export async function requireMember(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
): Promise<Id<"users">> {
  const userId = await requireUser(ctx);
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q) =>
      q.eq("groupId", groupId).eq("userId", userId),
    )
    .unique();
  if (!membership) {
    throw new Error("Not a member of this group");
  }
  return userId;
}

export async function requireOwner(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
): Promise<Id<"users">> {
  const userId = await requireUser(ctx);
  const group = await ctx.db.get(groupId);
  if (!group) {
    throw new Error("Group not found");
  }
  if (group.ownerId !== userId) {
    throw new Error("Only the group owner can do this");
  }
  return userId;
}

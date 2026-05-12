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

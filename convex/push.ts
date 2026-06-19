/**
 * Web Push subscription storage (default Convex runtime).
 *
 * The actual send lives in convex/pushNode.ts ("use node", needs the web-push
 * npm lib) — a file with "use node" can hold ONLY actions, so the queries and
 * mutations that touch the DB live here.
 */
import { v } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Upsert the current user's push subscription (one row per browser/device,
 * keyed by endpoint). Called from the client after the user grants permission
 * and PushManager.subscribe() succeeds.
 */
export const savePushSubscription = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string() },
  handler: async (ctx, { endpoint, p256dh, auth }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { userId, p256dh, auth });
      return;
    }
    await ctx.db.insert("pushSubscriptions", {
      userId,
      endpoint,
      p256dh,
      auth,
      createdAt: Date.now(),
    });
  },
});

/** Remove a subscription (user disabled push, or unsubscribed in the browser). */
export const deletePushSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;
    const row = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    // Defense-in-depth: only delete your own subscription.
    if (row && row.userId === userId) await ctx.db.delete(row._id);
  },
});

/** Whether a subscription exists for this endpoint (read-only). */
export const hasPushSubscription = query({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const row = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    return row !== null;
  },
});

// ── Internal helpers used by the node sender (convex/pushNode.ts) ──────────

export const _listForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: (ctx, { userId }) =>
    ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect(),
});

export const _deleteByEndpoint = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const row = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (row) await ctx.db.delete(row._id);
  },
});

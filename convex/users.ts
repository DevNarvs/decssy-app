/**
 * User-related queries and mutations.
 *
 * Convex Auth manages the `users` table itself (creating rows on sign-up,
 * linking OAuth accounts, etc.). This file adds Decssy-specific user logic
 * on top — fetching the current user with our extended fields.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Returns the currently signed-in user document, or null if not signed in
 * (the latter shouldn't happen on protected routes — middleware redirects
 * unauthed users to /sign-in — but defensive null-handling keeps queries
 * safe during the brief post-login render before the session hydrates).
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Idempotent: ensure the user has at least one group they can add events
 * to. If the user is in zero groups (fresh account or deleted everything),
 * create a "My Schedule" personal group for them so the calendar tab is
 * usable without manual setup.
 *
 * Safe to call on every /calendar mount — the membership check is O(1)
 * via the by_user index.
 */
export const ensurePersonalGroup = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    // Backfill: if the user has a "My Schedule" group they own where they're
    // the only member but the isPersonalDefault flag isn't set (auto-created
    // before the flag existed), patch it now. Cheap idempotent fixup.
    const ownedGroups = await ctx.db
      .query("groups")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    for (const g of ownedGroups) {
      if (g.isPersonalDefault === true) continue;
      if (g.name !== "My Schedule") continue;
      const memberCount = (
        await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", g._id))
          .collect()
      ).length;
      if (memberCount === 1) {
        await ctx.db.patch(g._id, { isPersonalDefault: true });
      }
    }

    // Skip creation if user is already in any group.
    const existingMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existingMembership) return null;

    const groupId = await ctx.db.insert("groups", {
      name: "My Schedule",
      color: "#8B5CF6", // violet — feels personal vs. social-group colors
      ownerId: userId,
      createdAt: Date.now(),
      isPersonalDefault: true,
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
 * Idempotent mutation to persist the user's timezone on their row.
 * Called once on first authenticated render, using the browser's IANA
 * timezone (Intl.DateTimeFormat().resolvedOptions().timeZone). Subsequent
 * calls with the same value are no-ops; different value triggers a patch.
 */
export const setTimezone = mutation({
  args: { timezone: v.string() },
  handler: async (ctx, { timezone }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User row missing — auth state likely stale");
    }
    if (user.timezone === timezone) return;
    await ctx.db.patch(userId, { timezone });
  },
});

/**
 * Owner-self mutation: update per-type email notification preferences.
 * Pass `true` to opt in, `false` to opt out, or omit a key to use defaults
 * (PRD §12.4: most types on by default; comment_added off by default).
 */
export const updateNotificationPrefs = mutation({
  args: {
    prefs: v.object({
      event_invite: v.optional(v.boolean()),
      event_updated: v.optional(v.boolean()),
      event_cancelled: v.optional(v.boolean()),
      comment_added: v.optional(v.boolean()),
      invite_accepted: v.optional(v.boolean()),
      ownership_transferred: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { prefs }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    await ctx.db.patch(userId, { notificationEmailPrefs: prefs });
  },
});

/**
 * Records onboarding completion. Idempotent — calling more than once
 * preserves the original onboardedAt timestamp. Updates name + timezone
 * at the same time so the user lands on /calendar with a configured row.
 */
export const completeOnboarding = mutation({
  args: {
    name: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, { name, timezone }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      throw new Error("Name must be 1–50 characters");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User row missing — auth state likely stale");
    }
    const patch: { name: string; timezone: string; onboardedAt?: number } = {
      name: trimmed,
      timezone,
    };
    if (user.onboardedAt === undefined) {
      patch.onboardedAt = Date.now();
    }
    await ctx.db.patch(userId, patch);
  },
});

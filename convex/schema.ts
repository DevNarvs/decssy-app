import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Decssy schema.
 *
 * `authTables` from @convex-dev/auth provides:
 *   - users (the canonical user; we extend it with `timezone` below)
 *   - authAccounts (linked OAuth accounts)
 *   - authSessions (active sessions)
 *   - authVerificationCodes (magic links, email verifications)
 *   - authVerifiers (passkey verifiers)
 *   - authRateLimits
 *   - authRefreshTokens
 *
 * We override `users` to add Decssy-specific fields. When overriding, we MUST
 * preserve all fields the auth library expects (name, image, email, etc.).
 */
export default defineSchema({
  ...authTables,

  // Override the auth-provided `users` table with our extension.
  users: defineTable({
    // ── Auth-managed fields (do not remove) ─────────────────────────────
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // ── Decssy extensions ────────────────────────────────────────────────
    timezone: v.optional(v.string()), // IANA, e.g. "Asia/Manila"; set during onboarding
    onboardedAt: v.optional(v.number()), // ms epoch — set once when user completes the 3-step onboarding
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // ── Future plans flesh these out — included now to lock the schema shape early.
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_user", ["groupId", "userId"]),

  groupInvites: defineTable({
    groupId: v.id("groups"),
    token: v.string(), // URL-safe random, ~24 chars (~143 bits entropy)
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(), // ms epoch; default = createdAt + 7d
    maxUses: v.optional(v.number()), // undefined = unlimited
    usedCount: v.number(), // increments on each successful acceptInvite
    revokedAt: v.optional(v.number()), // soft revoke; absence = active
  })
    .index("by_token", ["token"])
    .index("by_group", ["groupId"]),

  events: defineTable({
    groupId: v.id("groups"),
    type: v.union(
      v.literal("personal_shared"),
      v.literal("group_shared"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    isAllDay: v.boolean(),
    startUtc: v.number(),
    endUtc: v.number(),
    eventTimezone: v.string(), // IANA — see PRD §14.2 for why all-day events need this
    createdBy: v.id("users"),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()), // soft delete
  })
    .index("by_group", ["groupId"])
    .index("by_group_and_start", ["groupId", "startUtc"])
    .index("by_creator", ["createdBy"]),

  eventAttendees: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("invited"),
      v.literal("attending"),
      v.literal("maybe"),
      v.literal("declined"),
    ),
    respondedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  eventComments: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  }).index("by_event_and_created", ["eventId", "createdAt"]),
});

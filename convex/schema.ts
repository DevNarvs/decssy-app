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
    notificationEmailPrefs: v.optional(
      v.object({
        event_invite: v.optional(v.boolean()),
        event_updated: v.optional(v.boolean()),
        event_cancelled: v.optional(v.boolean()),
        comment_added: v.optional(v.boolean()),
        invite_accepted: v.optional(v.boolean()),
        ownership_transferred: v.optional(v.boolean()),
        event_reminder: v.optional(v.boolean()),
      }),
    ),
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
    // Flag for the auto-created "My Schedule" personal group. When true,
    // invite/share affordances are hidden (it's a single-user calendar by
    // design — adding members would defeat the point). Created by
    // ensurePersonalGroup; never set manually elsewhere.
    isPersonalDefault: v.optional(v.boolean()),
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

  // Per-event share tokens (distinct from groupInvites). Grant a single
  // recipient RSVP access to ONE event without joining any group — the
  // recipient gets an eventAttendees row, never a groupMembers row. Used by
  // the "share a personal event" flow. See convex/eventShares.ts.
  eventShares: defineTable({
    eventId: v.id("events"),
    token: v.string(), // same generator as group invites (~143 bits entropy)
    createdBy: v.id("users"), // must be the event creator
    createdAt: v.number(),
    expiresAt: v.number(), // ms epoch; default = createdAt + 30d
    revokedAt: v.optional(v.number()), // soft revoke; absence = active
  })
    .index("by_token", ["token"])
    .index("by_event", ["eventId"]),

  events: defineTable({
    groupId: v.id("groups"),
    type: v.union(
      v.literal("personal_shared"),
      v.literal("group_shared"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()), // free-text venue; client builds a maps link from it
    isAllDay: v.boolean(),
    startUtc: v.number(),
    endUtc: v.number(),
    eventTimezone: v.string(), // IANA — see PRD §14.2 for why all-day events need this
    recurrenceRule: v.optional(v.string()), // RFC 5545 RRULE string; undefined = one-off
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
  })
    .index("by_event_and_created", ["eventId", "createdAt"])
    .index("by_author", ["userId"]), // for purging a deleted user's comments

  notifications: defineTable({
    userId: v.id("users"), // recipient
    type: v.union(
      v.literal("event_invite"),
      v.literal("event_updated"),
      v.literal("event_cancelled"),
      v.literal("comment_added"),
      v.literal("invite_accepted"),
      v.literal("ownership_transferred"),
      v.literal("event_reminder"),
    ),
    groupId: v.optional(v.id("groups")),
    eventId: v.optional(v.id("events")),
    actorName: v.string(),
    actorUserId: v.optional(v.id("users")),
    message: v.string(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
    emailSentAt: v.optional(v.number()),
  })
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_user_and_unread", ["userId", "readAt"])
    .index("by_email_pending", ["emailSentAt", "createdAt"]),

  // Per-(user, group) notification mute. Presence of a row = that user has
  // muted that group; createNotification skips muted recipients, killing
  // both the in-app notification and the email for that group. Absence =
  // unmuted (default). Whole-group granularity. See convex/notifications.ts.
  notificationMutes: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_group", ["userId", "groupId"]),

  // Dedup ledger for the event-reminder cron. One row per reminder actually
  // sent, keyed by the specific OCCURRENCE start (recurring events reuse the
  // parent _id, so eventId alone would collide across occurrences) + user +
  // lead window. The producer inserts a row in the same mutation as the
  // notification, so a retried/overlapping cron run never double-reminds.
  // See convex/crons.ts generateEventReminders.
  eventReminders: defineTable({
    eventId: v.id("events"),
    occurrenceStartUtc: v.number(),
    userId: v.id("users"),
    leadKey: v.union(v.literal("24h"), v.literal("1h")),
    createdAt: v.number(),
  }).index("by_dedup", ["eventId", "occurrenceStartUtc", "userId", "leadKey"]),

  // Web Push subscriptions (one per browser/device the user enabled push on).
  // The Convex node action convex/pushNode.ts reads these to fan out pushes;
  // dead endpoints (HTTP 404/410) are pruned on send. See convex/push.ts.
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
});

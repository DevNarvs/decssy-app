# Plan 9: Notifications — Implementation Plan

> Yolo compact. In-app first; email is env-var-gated (works without Resend setup; activates when AUTH_RESEND_API_KEY is set).

**Goal:** Trigger in-app notifications when events change, comments arrive, invites accepted, ownership transferred. /inbox tab becomes the unified feed. Bell badge in nav shows unread count. Email delivery via Resend optional — defaults to console-log if `AUTH_RESEND_API_KEY` not set in Convex env (so the feature ships without external setup).

**Schema:**
```typescript
notifications: defineTable({
  userId: v.id("users"),
  type: v.union(
    v.literal("event_invite"),
    v.literal("event_updated"),
    v.literal("event_cancelled"),
    v.literal("comment_added"),
    v.literal("invite_accepted"),
    v.literal("ownership_transferred"),
  ),
  // Polymorphic payload — TypeScript discriminated union at read time.
  groupId: v.optional(v.id("groups")),
  eventId: v.optional(v.id("events")),
  actorName: v.string(),       // "Anna" — who triggered it
  actorUserId: v.optional(v.id("users")),
  message: v.string(),          // pre-rendered display text (e.g., "Anna RSVP'd to Movie Night")
  createdAt: v.number(),
  readAt: v.optional(v.number()),
  emailSentAt: v.optional(v.number()),
})
  .index("by_user_and_created", ["userId", "createdAt"])
  .index("by_user_and_unread", ["userId", "readAt"]),
```

**Triggers (in existing mutations):**
- `createEvent` → for `personal_shared` events: notify all invited attendees (not creator)
- `updateEvent` → notify all attending/maybe attendees
- `cancelEvent` → notify all non-declined attendees
- `addComment` → notify all event attendees except commenter
- `acceptInvite` → notify the group owner
- `transferOwnership` → notify the new owner

**Files:**
- `convex/schema.ts` ← MODIFIED
- `convex/notifications.ts` ← NEW (queries + mutations + helper)
- `convex/email.ts` ← NEW (Resend wrapper, env-var-gated, "use node")
- `convex/crons.ts` ← NEW (every 5 min, picks up emailSentAt-null rows, sends)
- All mutation files (events.ts, comments.ts, invites.ts, groups.ts) ← MODIFIED (call helper)
- `components/notifications/NotificationItem.tsx` ← NEW
- `components/nav/BottomTabBar.tsx` + `SidebarNav.tsx` ← MODIFIED (unread badge on Inbox)
- `app/(app)/inbox/page.tsx` ← REWRITTEN

**Out of scope:** per-type email preferences (defer to Plan 10 — for now: all types email if Resend is configured), real-time push (PWA Phase 2).

---

## Tasks

1. Schema add
2. `convex/notifications.ts`: helper `createNotification`, queries `listMyNotifications` + `countUnread`, mutations `markRead` + `markAllRead`
3. Wire helper into the 6 mutation hooks
4. `convex/email.ts`: env-gated Resend wrapper (action, "use node")
5. `convex/crons.ts`: every 5 min, pick up unsent + send
6. `NotificationItem` component (icon + text + relative time)
7. `/inbox/page.tsx` rewrite (groups by Today / Yesterday / Earlier)
8. Unread badge on nav bell icon
9. README + build

Each step is mechanical given the schema and helper.

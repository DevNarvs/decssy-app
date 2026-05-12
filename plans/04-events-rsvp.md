# Plan 4: Events & RSVP (one-off) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans`. Yolo-mode format — full code only for novel patterns; standard CRUD patterns reference Plan 2/3 examples.

**Goal:** Members create events in a group (personal_shared OR group_shared). RSVP works with real-time propagation. group_shared events auto-attend every current member. Comments are functional. No recurrence yet (Plan 7).

**Architecture:**
- 3 new tables: `events`, `eventAttendees`, `eventComments`
- Enums move to `convex/lib/enums.ts` (already a placeholder file from Plan 1)
- New permission helper: `requireEventAttendee` (a user can read an event if they're a member of its group; they can RSVP if they're an invited attendee)
- `deleteGroup` extended again to cascade: events, attendees, comments
- UI: group detail page gets "Upcoming events" list; event create form; event detail with RSVP + comments
- Pages live under `/groups/[id]/events/...` (not at top-level `/events/...` — events always have a parent group)

**Out of scope (deferred):**
- Recurring events → Plan 7
- Calendar grid UI → Plan 5
- Find-free-day → Plan 8
- Notifications on RSVP/comment → Plan 9

---

## File structure (delta)

```
decssy/
├─ app/(app)/groups/[id]/
│  ├─ page.tsx                     ← MODIFIED (add upcoming events section)
│  └─ events/
│     ├─ new/page.tsx              ← NEW
│     └─ [eid]/page.tsx            ← NEW (event detail)
├─ components/events/
│  ├─ EventCard.tsx                ← NEW (list item with time + type + status)
│  ├─ EventCreateForm.tsx          ← NEW
│  ├─ EventTimeDisplay.tsx         ← NEW (formats all-day vs timed nicely)
│  ├─ EventTypeSelector.tsx        ← NEW (segmented personal_shared / group_shared)
│  ├─ RsvpControl.tsx              ← NEW (Going / Maybe / Can't go)
│  ├─ AttendeesList.tsx            ← NEW (avatar + name + status icon)
│  └─ CommentThread.tsx            ← NEW (list + new-comment input)
├─ convex/
│  ├─ schema.ts                    ← MODIFIED (3 tables)
│  ├─ events.ts                    ← NEW
│  ├─ rsvp.ts                      ← NEW
│  ├─ comments.ts                  ← NEW
│  ├─ groups.ts                    ← MODIFIED (extend deleteGroup cascade)
│  └─ lib/
│     ├─ enums.ts                  ← MODIFIED (EVENT_TYPES + RSVP_STATUSES)
│     └─ permissions.ts            ← MODIFIED (add requireEventAttendee)
└─ tests/e2e/
   └─ events.spec.ts               ← NEW (skip-when-unauthed)
```

---

## Schema additions

```typescript
// In convex/schema.ts, after groupInvites:

events: defineTable({
  groupId: v.id("groups"),
  type: v.union(v.literal("personal_shared"), v.literal("group_shared")),
  title: v.string(),
  description: v.optional(v.string()),
  isAllDay: v.boolean(),
  startUtc: v.number(),       // ms epoch
  endUtc: v.number(),         // ms epoch
  eventTimezone: v.string(),  // IANA — tz the event was authored in (matters for all-day)
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
  .index("by_event_and_created", ["eventId", "createdAt"]),
```

## Enums (convex/lib/enums.ts — replace placeholder)

```typescript
export const EVENT_TYPES = {
  personal_shared: {
    label: "Personal",
    description: "Broadcast your availability — friends RSVP",
    icon: "user",
  },
  group_shared: {
    label: "Group event",
    description: "We're all attending — no RSVP needed",
    icon: "users",
  },
} as const;
export type EventType = keyof typeof EVENT_TYPES;

export const RSVP_STATUSES = {
  invited:   { label: "No response yet", color: "#9CA3AF" },
  attending: { label: "Going",            color: "#3aab6e" },
  maybe:     { label: "Maybe",            color: "#e8a530" },
  declined:  { label: "Can't go",         color: "#e04f4f" },
} as const;
export type RsvpStatus = keyof typeof RSVP_STATUSES;
```

---

## Task 0: Pre-flight

```bash
git status
SKIP_AUTH_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test --reporter=list | tail -3
```

Expected: clean tree, 8/8 non-auth tests pass.

---

## Task 1: Schema + enums

- Modify `convex/schema.ts` (add 3 tables above)
- Replace `convex/lib/enums.ts` with the EVENT_TYPES + RSVP_STATUSES export above
- Run `npx convex dev --once && npx tsc --noEmit`
- Commit: "feat: events + eventAttendees + eventComments schema + enums"

## Task 2: Permission helper

Append to `convex/lib/permissions.ts`:

```typescript
/**
 * Resolves the caller's attendance row for an event, or null.
 * Used by setRsvp / addComment / event detail queries to enforce that the
 * caller is part of the conversation.
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
```

(Add `import { getAuthUserId } from "@convex-dev/auth/server";` at top.)

- Commit: "feat: getAttendance helper for event RSVP/comment permission checks"

## Task 3: convex/events.ts

Create `convex/events.ts` with:

- **`createEvent` mutation**: validates fields (title 1–100, end > start, valid type, valid IANA tz). Auto-adds `eventAttendees` rows:
  - For `group_shared`: every current group member gets `status: "attending"`
  - For `personal_shared`: only the creator gets `status: "attending"`; other members get `status: "invited"`
- **`listGroupEvents` query**: takes `groupId` + `rangeStart` + `rangeEnd` ms. Returns events in that range (filters `deletedAt === undefined`), sorted by `startUtc` ascending. Returns null if not a member.
- **`listUpcomingEventsInGroup` query**: convenience for the group detail page — next 5 events from now. Returns null if not a member.
- **`getEvent` query**: returns `{ event, attendees, comments, myStatus }` with hydrated names. Returns null if not a member of the group.
- **`updateEvent` mutation**: creator-only. Patch any subset (title, description, time, isAllDay). Validates same as create.
- **`cancelEvent` mutation**: creator-only. Soft delete (set `deletedAt`). Cascade: nothing — attendees + comments stay attached for history.

(Pattern is identical to `convex/groups.ts` from Plan 2 — same shape, different table.)

- Commit: "feat: events.ts — create/list/get/update/cancel with type-aware attendee init"

## Task 4: convex/rsvp.ts

Create `convex/rsvp.ts`:

```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAttendance } from "./lib/permissions";

const VALID = ["attending", "maybe", "declined"] as const;

export const setRsvp = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("attending"),
      v.literal("maybe"),
      v.literal("declined"),
    ),
  },
  handler: async (ctx, { eventId, status }) => {
    const me = await getAttendance(ctx, eventId);
    if (!me) throw new Error("You're not on this event's invite list");
    const row = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", eventId).eq("userId", me.userId),
      )
      .unique();
    if (!row) throw new Error("Attendance row missing");
    await ctx.db.patch(row._id, { status, respondedAt: Date.now() });
  },
});
```

- Commit: "feat: rsvp.ts — setRsvp with attendance validation + respondedAt"

## Task 5: convex/comments.ts

Create `convex/comments.ts`:

```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAttendance } from "./lib/permissions";
import { requireUser } from "./lib/permissions";

const MAX_BODY = 1000;

export const addComment = mutation({
  args: { eventId: v.id("events"), body: v.string() },
  handler: async (ctx, { eventId, body }) => {
    const me = await getAttendance(ctx, eventId);
    if (!me) throw new Error("You can only comment on events you're invited to");
    const trimmed = body.trim();
    if (trimmed.length < 1) throw new Error("Empty comment");
    if (trimmed.length > MAX_BODY) throw new Error(`Comment max ${MAX_BODY} chars`);
    await ctx.db.insert("eventComments", {
      eventId,
      userId: me.userId,
      body: trimmed,
      createdAt: Date.now(),
    });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("eventComments") },
  handler: async (ctx, { commentId }) => {
    const userId = await requireUser(ctx);
    const c = await ctx.db.get(commentId);
    if (!c || c.deletedAt !== undefined) return; // idempotent
    if (c.userId !== userId) {
      throw new Error("Only the comment author can delete it");
    }
    await ctx.db.patch(commentId, { deletedAt: Date.now() });
  },
});
```

- Commit: "feat: comments.ts — addComment (member-only) + deleteComment (author-only)"

## Task 6: Extend deleteGroup cascade

Modify `convex/groups.ts` `deleteGroup` handler — after deleting invites, also delete:

```typescript
// Events + their attendees + comments
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
```

- Commit: "feat: deleteGroup cascades to events + attendees + comments"

---

## Task 7: EventTimeDisplay component

Create `components/events/EventTimeDisplay.tsx`:

```tsx
"use client";

import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Formats event time per PRD §14: timed events shown in viewer's tz; all-day
 * events shown in the event's authored tz (so "Friday May 10" stays Friday
 * regardless of where the viewer is).
 */
export function EventTimeDisplay({
  event,
  short = false,
}: {
  event: Doc<"events">;
  short?: boolean;
}) {
  if (event.isAllDay) {
    const d = new Date(event.startUtc);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: event.eventTimezone,
      weekday: short ? "short" : "long",
      month: "short",
      day: "numeric",
    });
    return (
      <span>
        {formatter.format(d)} · <span className="text-text-muted">All day</span>
      </span>
    );
  }
  const start = new Date(event.startUtc);
  const end = new Date(event.endUtc);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: short ? "short" : "long",
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <span>
      {dateFormatter.format(start)} · {timeFormatter.format(start)}–
      {timeFormatter.format(end)}
    </span>
  );
}
```

- Commit (defer — bundled with other components)

## Task 8: EventTypeSelector + EventCreateForm + EventCard + RsvpControl + AttendeesList + CommentThread

Build the remaining 6 components. Each follows Plan 2/3 patterns:

- **`EventTypeSelector`**: 2-option segmented control (personal_shared / group_shared) with icons + descriptions from EVENT_TYPES enum
- **`EventCreateForm`**: title, description, type (default personal_shared), all-day toggle, start/end pickers (date + time inputs), group is fixed from URL params
- **`EventCard`**: list item with title, time via EventTimeDisplay, type badge, your RSVP status pill
- **`RsvpControl`**: 3-button segmented for personal_shared events; for group_shared shows a single "Auto-attending" badge + change-to-decline option
- **`AttendeesList`**: hydrated members from `getEvent` query, status icon, names
- **`CommentThread`**: list of comments with author + time + body, input at bottom

- Commit: "feat: 6 event components — selector, form, card, RSVP, attendees, comments"

## Task 9: /groups/[id]/events/new page

Create `app/(app)/groups/[id]/events/new/page.tsx`:

```tsx
"use client";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventCreateForm } from "@/components/events/EventCreateForm";
import type { Id } from "@/convex/_generated/dataModel";

interface PageProps { params: Promise<{ id: string }>; }

export default function NewEventPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link href={`/groups/${groupId}`} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-text">New event</h1>
      </header>
      <EventCreateForm groupId={groupId} />
    </div>
  );
}
```

## Task 10: /groups/[id]/events/[eid] page

Create `app/(app)/groups/[id]/events/[eid]/page.tsx`:

```tsx
"use client";
import { use } from "react";
// ... use api.events.getEvent, returns null on no-access (Plan 2 pattern)
// Render: header (back + edit/cancel if creator), EventTimeDisplay, RsvpControl,
//   AttendeesList, CommentThread.
```

Full implementation follows the /groups/[id] detail pattern from Plan 2: skeleton loading → null-redirect → main content.

## Task 11: Add upcoming events section to /groups/[id]

Modify `app/(app)/groups/[id]/page.tsx` — below the GroupHero + Invite CTA, add:

```tsx
<section>
  <div className="mb-2 flex items-center justify-between px-1">
    <h3 className="text-sm font-extrabold uppercase tracking-wide text-text-muted">
      Upcoming events
    </h3>
    <Link href={`/groups/${groupId}/events/new`} className="text-sm font-bold text-accent">+ New</Link>
  </div>
  {/* useQuery(api.events.listUpcomingEventsInGroup, { groupId }) → map to EventCard,
      or EmptyState if none */}
</section>
```

## Task 12: E2E test

Create `tests/e2e/events.spec.ts` — public-only test verifying `/groups/[id]/events/new` redirects unauthed users to /sign-in. Auth-required tests skip-when-unauthed (Plan 2 pattern).

## Task 13: README + final build check

```bash
npx tsc --noEmit
npm run build | tail -25
SKIP_AUTH_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test --reporter=list | tail -5
```

Update `README.md` plan roadmap: ✅ Plan 4.

Commit: "test+docs: Plan 4 e2e + README — Plan 4 complete"

---

## Self-Review

- **PRD coverage**: §5.3 Events (create personal+group_shared, edit, cancel, RSVP, comment, attendees) ✅. §7.5-7.7 schema ✅. §15 edge cases — basic ones handled; group_shared decline allowed (PRD §4.3) ✅.
- **Out of scope (intentional)**: recurrence, calendar grid, find-free-day, notifications, comments on cancelled events.
- **Type consistency**: `Doc<"events">` flows through all components; enum types from convex/lib/enums.ts shared client+server.
- **Risks**:
  1. `listUpcomingEventsInGroup` materializes all events into memory — fine for MVP (groups have <100 events); Plan 7 needs RRULE expansion that scales differently.
  2. Comments on cancelled events: we don't block — author can still see history. Decision deferred (Plan 9 notification might revisit).
  3. Timezone handling for all-day events follows PRD §14.2 — formatted in event's authored tz.

**Plan complete.** Saved to `plans/04-events-rsvp.md`.

# Decssy — Product Requirements Document (PRD)

**Status:** Draft v1.0
**Date:** 2026-05-07
**Owner:** Marvin Donina (marvin.donina@cvmfinance.com)
**Document type:** Product spec / design brief

---

## 1. Executive Summary

**Decssy** is a mobile-first social calendar web app for small friend groups, families, and small teams. Users create groups, share invite links/QR codes, and coordinate events together. The product solves the "are we all free?" problem without requiring everyone to share their full personal calendar.

**The core loop:**
1. Create a group → share a QR/link
2. Friends scan/click → sign up → auto-join the group
3. Anyone in the group posts events (either *broadcasting personal availability* or *creating a group-wide event*)
4. Members RSVP, comment, and use **Find Free Day** to schedule around each other

**One-line pitch:** *A shared calendar for the group chat — built so friends, families, and teams can plan things together without herding everyone in iMessage.*

---

## 2. Problem Statement

Coordinating plans across a group is painful:
- iMessage/WhatsApp threads spiral out of control with date proposals
- Google Calendar is for personal use; sharing requires "calendar invites" friends rarely accept
- Tools like Doodle solve one polling moment but don't sit with the group long-term
- No good answer for: *"What is my friend group doing this weekend, and when is everyone free?"*

**The user's mental model**: "I want my friends to know when I'm busy, see what we're doing together, and find a day everyone is free — without giving up my whole personal calendar."

---

## 3. Target Users

| Persona | Description | Primary use case |
|---|---|---|
| **The Connector** | The person who organizes plans for their friend group | Create group, post events, hunt free dates |
| **The Casual Friend** | Joins via QR; checks in occasionally | RSVP, see what's happening, post own personal-shared events |
| **The Family Organizer** | Manages a family group | Group-shared events for birthdays, dinners, vacations |
| **The Small Team Lead** | Manages a hobby club, sports team, or 5-10 person work group | Recurring events, find-free-day for meetings |

**Out of scope for MVP:** enterprise teams (>20 members), public-facing event listings, dating-app-style discovery.

---

## 4. Core Concepts

### 4.1 Groups
A **group** is a named collection of users sharing a calendar. Created by an **owner**, who can invite, remove, transfer ownership, or delete. Each group has a color (used to color-code its events on the calendar). A user can belong to many groups.

### 4.2 Events
An **event** is something that happens at a specific time. Two types:

| Type | Behavior | Example |
|---|---|---|
| `personal_shared` | Belongs to one person; broadcast to a group. Members see it and can RSVP. | "I'm out of town May 10–12" |
| `group_shared` | Belongs to the group itself. All members are auto-attendees. | "Family Christmas dinner Dec 25" |

Events can be **all-day** or **timed** (start/end). They can be **one-time** or **recurring** (RFC 5545 RRULE).

### 4.3 RSVP
Members respond to `personal_shared` events with one of four statuses: `invited` (default, no response yet), `attending`, `maybe`, `declined`. RSVPs propagate in real-time.

**`group_shared` events** auto-attend by default — when created, every current group member is inserted as an attendee with status `attending`. Members can still change their status to `maybe` or `declined` (the UI just doesn't pester them with an "RSVP needed" prompt the way it does for `personal_shared`). When a NEW member joins a group, they are auto-added as `attending` to any future-dated, non-cancelled `group_shared` events; past events are not back-filled.

### 4.4 Invites
Group access is **invite-only**. Owners generate **invite tokens** which render as both a **QR code** and a **shareable URL** (e.g., `decssy.app/join/abc123XYZ`). Tokens have an expiry (default 7 days), an optional usage cap, and can be revoked.

### 4.5 Find Free Day
A scheduling helper. User picks a group + date range + duration, app returns slots where the selected members are all free.

### 4.6 Color-Coded Groups
Each group has a hex color. Events on the merged calendar render in their group's color, so a user in 4 groups can visually tell which event is from which group at a glance.

---

## 5. User Stories

### 5.1 Onboarding
- As a new user, I can sign up with email or Google (via Clerk)
- As a new user, I can set my display name, avatar, and timezone on first run
- As a new user, I can either create my first group OR paste/scan an invite

### 5.2 Group Management
- As an owner, I can create a group with a name, optional description, and a color
- As an owner, I can generate a QR code + invite link for my group
- As an owner, I can revoke an active invite
- As an owner, I can remove a member
- As an owner, I can transfer ownership to another member
- As an owner, I can delete a group (with confirmation)
- As a member, I can leave a group
- As a member, I can see the member list and a high-level group history (audit log)

### 5.3 Events
- As a member, I can create a `personal_shared` or `group_shared` event in any group I belong to
- As an event creator, I can set: title, description, start/end (or all-day), recurrence, group
- As an event creator, I can edit or cancel my events; updates propagate to all attendees
- As a member, I can RSVP to a `personal_shared` event (`attending` / `maybe` / `declined`)
- As a member, I can comment on any event in my groups
- As a member, I can see the attendee list with statuses on any event

### 5.4 Calendar Viewing
- As a user, I can see a unified calendar of events from all my groups, color-coded
- As a user, I can filter the calendar by one or more groups
- As a user, I can switch between month and agenda views
- As a user, I can swipe left/right to navigate months
- As a user, I can tap a date to see that day's events

### 5.5 Find Free Day
- As a user, I can pick a group + date range + duration → see when members are free
- As a user, I can filter results by time-of-day (morning/afternoon/evening)
- As a user, I can include/exclude specific members in the calculation
- As a user, I can turn a result slot into a pre-filled event creation form

### 5.6 Notifications
- As a user, I receive an in-app notification when:
  - I'm invited to a `personal_shared` event
  - An event I RSVP'd to is updated or cancelled
  - Someone comments on an event I'm attending or created
  - Group ownership changes
- As a user, I receive an email for the same events (toggleable per-type in settings)

---

## 6. Decisions Log (locked from brainstorming)

| # | Decision | Locked choice |
|---|---|---|
| 1 | Event model | Hybrid: `personal_shared` + `group_shared` |
| 2 | Sharing model | Account required; QR/link = signed invite token |
| 3 | Friend interaction | RSVP model — propagating updates |
| 4 | Time precision | All-day OR timed (per-event toggle) |
| 5 | Scheduling helpers | Find Free Day (MVP) + Polling (Phase 2) |
| 6 | Group roles | Owner-only + ownership transfer |
| 7 | Tech stack | Next.js 15 + Convex + Vercel + Clerk + Tailwind + shadcn/ui |
| 8 | Mobile strategy | Mobile-first responsive + PWA |
| 9 | Notifications | In-app + email (MVP); push (Phase 2) |
| 10 | Recurring events | RFC 5545 RRULE strings |
| 11 | Color-coded groups | Per-group hex color |
| 12 | Timezones | Store UTC + IANA tz; display in viewer's tz |
| 13 | Event comments | MVP feature |
| 14 | Enum modeling | TypeScript literal unions + config map (not master tables) |
| 15 | Visual direction | "Peach Fuzz" — warm cream surfaces, rounded radii, pink accent |
| 16 | Brand accent | Locked at `#e8519a` (pink) — NOT user-configurable |
| 17 | Group color palette | 8 colors locked (see §16.5); Phase 2 may add a custom hex input |
| 18 | Typography | Plus Jakarta Sans (weights 500/600/700/800/900) — Google Fonts |
| 19 | Tablet breakpoint | 768px (mobile→tablet); 1024px (tablet→desktop) |
| 20 | PWA safe area | `env(safe-area-inset-bottom)` mandatory for iOS home indicator |

---

## 7. Data Model

Defined in `convex/schema.ts` as TypeScript. Twelve collections.

### 7.1 `users`
Synced from Clerk. One row per signed-up account.

| Field | Type | Notes |
|---|---|---|
| `clerkId` | string | Indexed; primary external identity |
| `email` | string | Indexed |
| `name` | string | Display name |
| `avatarUrl` | string? | From Clerk or user-uploaded |
| `timezone` | string | IANA, e.g., "Asia/Manila"; required |

### 7.2 `groups`
| Field | Type | Notes |
|---|---|---|
| `name` | string | Required, max 50 chars |
| `description` | string? | Optional, max 280 chars |
| `color` | string | Hex code, e.g., "#10B981"; default-assigned from a palette |
| `ownerId` | Id<"users"> | Indexed |
| `createdAt` | number | ms epoch |

### 7.3 `groupMembers`
| Field | Type | Notes |
|---|---|---|
| `groupId` | Id<"groups"> | Indexed |
| `userId` | Id<"users"> | Indexed |
| `joinedAt` | number | ms epoch |

Compound index `by_group_and_user` for membership checks.

### 7.4 `groupInvites`
| Field | Type | Notes |
|---|---|---|
| `groupId` | Id<"groups"> | Indexed |
| `token` | string | Indexed unique; URL-safe random (~24 chars) |
| `createdBy` | Id<"users"> | Owner who issued |
| `expiresAt` | number | Default = createdAt + 7d |
| `maxUses` | number? | Optional cap |
| `usedCount` | number | Increments on join |
| `revokedAt` | number? | Set when revoked |

### 7.5 `events`
The heart of the schema.

| Field | Type | Notes |
|---|---|---|
| `groupId` | Id<"groups"> | Indexed |
| `type` | `"personal_shared"` \| `"group_shared"` | Literal union |
| `title` | string | Required, max 100 chars |
| `description` | string? | Max 2000 chars |
| `isAllDay` | boolean | If true, only `startUtc`/`endUtc` represent date boundaries |
| `startUtc` | number | ms epoch |
| `endUtc` | number | ms epoch |
| `eventTimezone` | string | IANA tz the event was authored in |
| `recurrenceRule` | string? | RFC 5545 RRULE; null = one-off |
| `recurrenceParentId` | Id<"events">? | For one-off exceptions to a series |
| `createdBy` | Id<"users"> | Indexed |
| `createdAt` | number | ms epoch |
| `deletedAt` | number? | Soft delete |

Compound index `by_group_and_start` for calendar range queries.

### 7.6 `eventAttendees`
| Field | Type | Notes |
|---|---|---|
| `eventId` | Id<"events"> | Indexed |
| `userId` | Id<"users"> | Indexed |
| `status` | `"invited"` \| `"attending"` \| `"maybe"` \| `"declined"` | Literal union |
| `respondedAt` | number? | Set when status moves off "invited" |

For `group_shared` events, all current group members are inserted with `status: "attending"` automatically at event creation. Members can later update their own row to `maybe` or `declined`. New members joining the group are inserted as `attending` for all future, non-cancelled `group_shared` events (handled in the `joinGroupViaToken` mutation).

### 7.7 `eventComments`
| Field | Type | Notes |
|---|---|---|
| `eventId` | Id<"events"> | Indexed |
| `userId` | Id<"users"> | Author |
| `body` | string | Markdown-light, max 1000 chars |
| `createdAt` | number | |
| `editedAt` | number? | |
| `deletedAt` | number? | Soft delete |

### 7.8 `notifications`
Polymorphic. Single table for all notification types.

| Field | Type | Notes |
|---|---|---|
| `userId` | Id<"users"> | Recipient; indexed with `createdAt` |
| `type` | string literal union | See below |
| `payload` | any | Discriminated union by `type` (typed via Zod or TS unions on read) |
| `createdAt` | number | |
| `readAt` | number? | |
| `emailSentAt` | number? | Tracks email dispatch separately for retry |

**Notification types (MVP):**
`event_invite`, `event_updated`, `event_cancelled`, `comment_added`, `group_invite_accepted`, `ownership_transferred`, `member_joined`, `member_removed`

### 7.9 `groupAuditLog`
Used to power the group history view and ownership-transfer trust.

| Field | Type | Notes |
|---|---|---|
| `groupId` | Id<"groups"> | Indexed |
| `action` | literal union | `created`, `ownership_transferred`, `member_joined`, `member_removed`, `member_left`, `invite_created`, `invite_revoked` |
| `actorId` | Id<"users"> | Who performed the action |
| `targetUserId` | Id<"users">? | If applicable (e.g., who was promoted/removed) |
| `metadata` | any | Free-form context |
| `createdAt` | number | |

### 7.10 `polls` *(Phase 2)*
| Field | Type | Notes |
|---|---|---|
| `groupId` | Id<"groups"> | Indexed |
| `title` | string | |
| `description` | string? | |
| `createdBy` | Id<"users"> | |
| `deadline` | number | ms epoch |
| `status` | `"open"` \| `"closed"` \| `"finalized"` | |
| `finalizedEventId` | Id<"events">? | When finalized → linked event |
| `createdAt` | number | |

### 7.11 `pollOptions` *(Phase 2)*
| Field | Type | Notes |
|---|---|---|
| `pollId` | Id<"polls"> | Indexed |
| `isAllDay` | boolean | |
| `startUtc` | number | |
| `endUtc` | number | |

### 7.12 `pollVotes` *(Phase 2)*
| Field | Type | Notes |
|---|---|---|
| `pollId` | Id<"polls"> | Indexed |
| `optionId` | Id<"pollOptions"> | Indexed |
| `userId` | Id<"users"> | |
| `vote` | `"yes"` \| `"maybe"` \| `"no"` | |
| `votedAt` | number | |

### 7.13 Enum config (NOT a table — TypeScript file)

`convex/lib/enums.ts` is the single source of truth for labels, icons, and colors:

```typescript
export const RSVP_STATUSES = {
  invited:   { label: "No response", icon: "circle",       color: "#9CA3AF" },
  attending: { label: "Going",       icon: "check-circle", color: "#10B981" },
  maybe:     { label: "Maybe",       icon: "help-circle",  color: "#F59E0B" },
  declined:  { label: "Can't go",    icon: "x-circle",     color: "#EF4444" },
} as const;

export const EVENT_TYPES = {
  personal_shared: { label: "Personal", description: "Broadcast your availability", icon: "user" },
  group_shared:    { label: "Group event", description: "We're all attending",      icon: "users" },
} as const;
```

Used by both server (Convex functions) and client (React components).

---

## 8. Information Architecture & Navigation

### 8.1 Bottom-tab navigation (mobile)

```
┌─────────────────────────────────────────┐
│   📅 Calendar  │ 👥 Groups │ 🔍 Find │ 🔔 Inbox  │
└─────────────────────────────────────────┘
```

**Why bottom tabs**: thumb-zone reachability; better discovery than hamburgers.

Profile/settings are behind the avatar in the top-right of the Calendar tab.

### 8.2 Tablet layout (≥768px)
- Bottom tabs become a left sidebar with labels
- Calendar tab uses a two-pane layout (month grid + persistent agenda panel)
- Bottom sheets become right-side drawer panels

### 8.3 Screen inventory

| # | Screen | Tab | Notes |
|---|---|---|---|
| 1 | Sign up / sign in | (auth) | Clerk-rendered, custom theme |
| 2 | Welcome / onboarding | (auth) | TZ, color, "create" or "have invite" |
| 3 | Calendar (home) | 📅 | Month grid + agenda below |
| 4 | Event detail (bottom sheet) | 📅 | RSVP, attendees, comments |
| 5 | Event create / edit | 📅 | Type, title, time, recurrence, group |
| 6 | Group list | 👥 | All groups w/ color dots, member counts |
| 7 | Group detail | 👥 | Members, invite, settings |
| 8 | Invite QR/Link share | 👥 | Big QR + copy-link + share sheet |
| 9 | Group create | 👥 | Name, description, color picker |
| 10 | Member detail (bottom sheet) | 👥 | Per-member actions (owner only) |
| 11 | Find Free Day | 🔍 | Inputs + result list |
| 12 | Notifications inbox | 🔔 | Unified feed |
| 13 | Profile | (avatar) | Name, avatar, timezone |
| 14 | Settings | (avatar) | Notification prefs, sign out |
| 15 | Invite landing | (public) | Public route → sign-in → auto-join |

---

## 9. Wireframes

### 9.1 Calendar (home)

```
┌────────────────────────────────────────┐
│  🌟 Decssy           [filter] [👤avatar]│
│                                        │
│  ◀  May 2026  ▶                        │
│                                        │
│  Sun Mon Tue Wed Thu Fri Sat           │
│   .   .   .   .   1   2   3            │
│   4   5   6   7   8   9   10🔵🟢       │  ← color dots = events
│  11  12  13  14  15  16  17🟣          │
│  18  19  20  21  22  23  24            │
│  25  26  27  28  29  30  31            │
│                                        │
│  ─── Upcoming ────────────────────     │
│  🟢 Sat May 10  Movie Night     7pm    │
│      RSVP'd: Going · 4 attending       │
│  🔵 Sun May 11  Family Brunch    All-day│
│      Auto-attended (group event)       │
│  🟣 Wed May 14  Standup         9–9:30 │
│                                        │
│            [ + ] (FAB)                 │
├────────────────────────────────────────┤
│  📅Cal│ 👥Groups │ 🔍Find │ 🔔Inbox    │
└────────────────────────────────────────┘
```

**Behaviors:**
- Swipe left/right on grid → prev/next month
- Tap date → that day's agenda scrolls into view
- Tap event → opens detail bottom sheet
- Filter chip → toggle which groups show
- "+" FAB → new event, pre-filled with selected date

### 9.2 Event Detail (bottom sheet)

```
┌────────────────────────────────────────┐
│             ▬▬▬ (drag handle)          │
│                                        │
│  🟢 Movie Night                        │
│  Sat May 10, 2026  ·  7:00 – 10:00 PM  │
│  📍 Family group  ·  By: Marvin        │
│                                        │
│  ─── Your RSVP ─────────────────────   │
│  [✓ Going]  [? Maybe]  [✕ Can't go]    │
│                                        │
│  ─── Attendees (4 going, 1 maybe) ──   │
│  🟢 Marvin  Going (host)               │
│  🟢 Anna    Going                      │
│  🟢 Ben     Going                      │
│  🟢 Cara    Going                      │
│  🟡 Dylan   Maybe                      │
│                                        │
│  ─── Comments ──────────────────────   │
│  Anna: Should we grab dinner first?    │
│         · 2h ago                       │
│  Marvin: yeah, 6pm at the diner?       │
│         · 1h ago                       │
│  [type a comment...]              [→]  │
│                                        │
│  [ Edit ]  [ Delete ]  ← creator only  │
└────────────────────────────────────────┘
```

### 9.3 Event Create/Edit

```
┌────────────────────────────────────────┐
│  ◀  New event                  [Save]  │
│                                        │
│  Type:                                 │
│  [● Personal] [○ Group event]          │  ← segmented
│                                        │
│  Title:                                │
│  [______________________________]      │
│                                        │
│  Group:                                │
│  [ Family ▼ ]                          │
│                                        │
│  All day:  [ ⚫ off ]                   │  ← toggle
│                                        │
│  Starts:                               │
│  [ May 10, 2026 ]  [ 7:00 PM ]         │
│  Ends:                                 │
│  [ May 10, 2026 ]  [10:00 PM ]         │
│                                        │
│  Repeats:  [ Doesn't repeat ▼ ]        │
│                                        │
│  Description:                          │
│  [______________________________]      │
│                                        │
│  [           Save event           ]    │
└────────────────────────────────────────┘
```

### 9.4 Group List

```
┌────────────────────────────────────────┐
│  Groups                       [+ New]  │
│                                        │
│  🟢 Family                    7 members│
│      Next: Movie Night, Sat            │
│                                        │
│  🔵 Gym buddies               4 members│
│      Next: HIIT, Mon 6am               │
│                                        │
│  🟣 Work team                10 members│
│      Next: Standup, today              │
│                                        │
│  🟡 Soccer league             12 members│
│      Next: Match, Sun                  │
└────────────────────────────────────────┘
```

### 9.5 Group Detail

```
┌────────────────────────────────────────┐
│  ◀  Family                       [⋯]   │
│                                        │
│  🟢 Family                             │
│  Our family group · 7 members          │
│  You're the owner                      │
│                                        │
│  [ 📤 Invite people ]                  │
│                                        │
│  ─── Members (7) ───────────────────   │
│  👤 Marvin (you · owner)               │
│  👤 Anna       Joined Mar 12           │
│  👤 Ben        Joined Mar 12           │
│  👤 Cara       Joined Mar 14           │
│  ...                                   │
│                                        │
│  ─── History ──────────────────────    │
│  · Apr 2: Cara joined                  │
│  · Mar 12: Anna, Ben joined            │
│  · Mar 1: Group created by you         │
│                                        │
│  ─── Danger zone ───────────────────   │
│  [ Transfer ownership ]                │
│  [ Delete group ]                      │
└────────────────────────────────────────┘
```

### 9.6 Invite QR/Link Share

```
┌────────────────────────────────────────┐
│  ◀  Family · Invite                    │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │         ████  █  ████            │  │
│  │         █  █     █  █            │  │
│  │         █  ███████  █            │  │
│  │           ██   ██                │  │
│  │         █  ███████  █            │  │
│  │         █  █     █  █            │  │
│  │         ████  █  ████            │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Or share the link:                    │
│  ┌──────────────────────────────────┐  │
│  │ decssy.app/join/abc123XYZ        │  │
│  │                       [📋 Copy]   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [📤 Share via...]                     │
│                                        │
│  Expires in 7 days · 0 of ∞ uses       │
│  [Revoke this invite]                  │
└────────────────────────────────────────┘
```

### 9.7 Find Free Day

```
┌────────────────────────────────────────┐
│  🔍 Find a free day                    │
│                                        │
│  Group:                                │
│  [ Family ▼ ]                          │
│                                        │
│  Between:                              │
│  [ May 10 ]  →  [ May 24 ]             │
│                                        │
│  Duration:                             │
│  ◯ All day                             │
│  ● Specific time:  [2 hours ▼]         │
│                                        │
│  Time of day:                          │
│  ☐ Morning (8am–12pm)                  │
│  ☑ Afternoon (12–5pm)                  │
│  ☑ Evening (5–10pm)                    │
│                                        │
│  Include people:  [4 of 5 ✏]            │
│                                        │
│  [        Find times        ]          │
│                                        │
│  ─── Results (8 slots) ───────────     │
│  ✨ Sat May 11   2:00–4:00 PM          │
│      All 4 free                        │
│  ✨ Sun May 12   3:00–5:00 PM          │
│      All 4 free                        │
│      [ Create event from this slot → ] │
│  ◯ Mon May 13   2:00–4:00 PM          │
│      3 of 4 free (Anna busy)           │
└────────────────────────────────────────┘
```

### 9.8 Notifications Inbox

```
┌────────────────────────────────────────┐
│  Notifications        [Mark all read]  │
│                                        │
│  ─── Today ────────────────────────    │
│  ● Anna RSVP'd "Going" to Movie Night  │
│      · 2h ago                          │
│  ● Ben commented on Standup            │
│      "I'll be 5 min late"              │
│      · 4h ago                          │
│                                        │
│  ─── Yesterday ────────────────────    │
│  ○ Cara joined Family group            │
│  ○ Marvin updated Movie Night time     │
│                                        │
│  ─── Earlier ──────────────────────    │
│  ○ Family Brunch was added by Anna     │
└────────────────────────────────────────┘
```

### 9.9 Invite Landing (public)

```
┌────────────────────────────────────────┐
│            🌟 Decssy                   │
│                                        │
│        You've been invited to          │
│                                        │
│           🟢 Family                    │
│        7 members · created by Marvin   │
│                                        │
│  [    Sign in to join the group   ]    │
│                                        │
│  New to Decssy? You'll create your     │
│  account and join in one step.         │
│                                        │
│  Invite expires in 5 days              │
└────────────────────────────────────────┘
```

---

## 10. Auth & Invite Flow

### 10.1 Authentication
- **Provider:** Clerk
- **Methods:** Email magic link, Google OAuth (Phase 2: Apple)
- **Session:** Clerk-managed JWT, refreshed automatically
- Convex receives Clerk identity via `ctx.auth.getUserIdentity()` and resolves to a `users` row

### 10.2 First-time sign-up flow

```
1. User lands on app (or invite landing) → "Sign up"
2. Clerk handles email/Google
3. On Clerk webhook → Convex creates `users` row (clerkId, email, name)
4. App redirects to onboarding:
   - Set timezone (auto-detected via Intl.DateTimeFormat, confirmable)
   - Choose avatar color
   - "Create your first group" OR "Got an invite link?"
5. → Calendar (home)
```

### 10.3 Invite flow (the core viral moment)

```
1. Owner taps "Invite people" in group detail
2. Server (Convex action) generates a token (24-char URL-safe random),
   inserts into `groupInvites` with default 7d expiry, returns:
     - QR code SVG (server-rendered via `qrcode` package)
     - Shareable URL: decssy.app/join/{token}
3. Owner shares (QR shown in person OR link copied to chat)

INVITED USER:
4. Anna scans QR or taps link → decssy.app/join/{token}
5. Invite landing page (PUBLIC ROUTE — works without auth):
   - Server validates token (not expired, not revoked, under maxUses)
   - Renders group preview: name, color, member count, owner name
   - OG meta tags rendered server-side for nice iMessage/WhatsApp previews
6. Anna taps "Sign in to join":
   - If new → Clerk sign-up flow → onboarding (skipping the "create group" step)
   - If existing user → Clerk sign-in
7. After auth, app calls `joinGroupViaToken({ token })` mutation:
   - Re-validates token
   - Inserts `groupMembers` row
   - Increments `groupInvites.usedCount`
   - Logs `member_joined` in `groupAuditLog`
   - Notifies owner (`group_invite_accepted` notification)
8. Anna lands on the group detail screen, group is now in her sidebar
```

### 10.4 Token security
- Tokens are random (not signed JWTs) — simpler, allows revocation by deletion/flag
- Tokens are checked against expiry, revocation, and usage cap on every redemption
- Tokens are case-sensitive, ~24 chars (~143 bits of entropy)
- Rate-limit token generation: max 5 active invites per group at a time

### 10.5 Permission enforcement
Every Convex query/mutation that touches group data must:
1. Resolve the calling user via `ctx.auth.getUserIdentity()`
2. Confirm membership via `groupMembers` lookup
3. For owner-only actions (invite, remove, transfer, delete): also check `groups.ownerId === userId`

A shared helper `requireMember(ctx, groupId)` and `requireOwner(ctx, groupId)` will enforce this consistently across all mutations.

---

## 11. Find Free Day Algorithm

### 11.1 Input
```typescript
{
  groupId: Id<"groups">,
  rangeStart: number,        // ms epoch
  rangeEnd: number,          // ms epoch
  durationMinutes: number,   // 0 = all-day search
  timeOfDayFilters: ("morning" | "afternoon" | "evening")[],
  includeUserIds: Id<"users">[],  // subset of group members
}
```

### 11.2 Algorithm (high-level)

```
1. Fetch all events in the group within [rangeStart, rangeEnd] for selected users
   - Includes events they're attending or invited to (NOT declined)
   - Materialize recurring events in the range (RRULE expansion)
2. Build "busy intervals" per user: list of (start, end) tuples
   - All-day events → entire day in user's tz becomes busy
3. Compute "free intervals" per user: invert busy within the search range
4. Compute group-free intervals: intersect free across selected users
5. Filter by:
   - durationMinutes (slot must be ≥ this long)
   - timeOfDayFilters (slot must overlap one of the selected windows)
6. Score and sort:
   - Primary sort: number of users free in the slot (descending)
   - Secondary: earliest start time
7. Return top 20 slots
```

### 11.3 Edge cases & decisions
- **Partial availability**: if a 2-hour slot has 4 of 5 users free, it still appears, ranked below fully-free slots, with a "(Anna busy)" note
- **Recurring event expansion**: capped at 1 year ahead to bound work; longer ranges return an error
- **Mixed timezones**: all calculations done in UTC; results displayed in viewer's timezone
- **All-day events**: block entire day in event's authored tz, then converted to UTC
- **Performance**: for a 7-person group over a 30-day window with normal event density (~50 events), expected runtime <100ms; further optimization with a dedicated `userBusyCache` table is Phase 2

### 11.4 "Create event from slot" flow
Tapping a result row opens the event create form pre-filled:
- Group: the searched group
- Type: `group_shared` (sensible default — searcher likely wants everyone)
- Start/end: the slot
- Title: empty for the user to fill

---

## 12. Notifications System

### 12.1 In-app notifications
- **Trigger**: Convex mutation that performs the action also inserts a `notifications` row
- **Delivery**: `notifications` is queried reactively by the client → bell icon badge updates instantly
- **Read state**: client calls `markRead({ id })` mutation when user opens the inbox

### 12.2 Email notifications
- **Provider**: Resend
- **Trigger**: Convex cron runs every 1 minute, picks up notifications with `emailSentAt: undefined` and the recipient's email-on toggle for that type
- **Batching**: notifications less than 5 minutes old are deferred; if a second notification arrives in that window, both go in one digest email
- **Templates**: React Email components, one per notification type, rendered server-side

### 12.3 Push notifications (Phase 2)
- Web Push API via service worker
- Requires PWA install + permission grant

### 12.4 Notification preferences
Settings screen has per-type toggles for email:
- Event invites (default: on)
- Event updates/cancellations (default: on)
- Comments on my events (default: on)
- Comments on events I'm attending (default: off — high noise)
- Group changes (default: on)

---

## 13. Recurring Events Strategy

### 13.1 Storage
- `events.recurrenceRule` holds a single RRULE string (RFC 5545)
- The DB stores ONE row for the recurring series — instances are not pre-materialized
- Edits to a single instance create a new event row with `recurrenceParentId` set ("exception")

### 13.2 Expansion
- A utility `expandRecurrence(event, rangeStart, rangeEnd)` generates instance dates within a range
- Used by:
  - Calendar query (to render upcoming instances)
  - Find Free Day algorithm
  - Notifications

### 13.3 Edit semantics
When a user edits a recurring event, the UI prompts:
- **Only this event** → creates an exception (`recurrenceParentId` set)
- **This and following** → splits the series at this date; original gets a `UNTIL` clause, new series starts fresh
- **All events** → updates the original recurrence row

### 13.4 Supported patterns (MVP)
- Daily, Weekly (specific days), Monthly (by date or by weekday-of-month), Yearly
- End condition: never, after N occurrences, until specific date
- Editor renders these as a sentence: "Every Tuesday, until June 30, 2026"

---

## 14. Timezone Strategy

### 14.1 Rules
1. **All timestamps stored in UTC** as ms-epoch numbers
2. **Each event records its `eventTimezone`** (IANA) — the tz it was authored in
3. **Each user has a `timezone`** (IANA) — set on onboarding, editable
4. **Calendar renders in the viewer's timezone** for timed events
5. **All-day events render in their `eventTimezone`** to prevent date-shift bugs

### 14.2 Why rule 5 matters
"All-day Friday May 10 in Manila" stored as UTC is `2026-05-09 16:00 UTC` to `2026-05-10 16:00 UTC`. A viewer in Tokyo (UTC+9) seeing this in their tz would see it span "May 10 1am to May 11 1am" — confusing. By rendering all-day events in the *event's* tz, "Friday May 10" stays "Friday May 10" for everyone.

### 14.3 Daylight saving
- RRULE expansion respects the event's tz, so "every Monday 7pm in New York" survives DST transitions correctly
- Use `luxon` or `date-fns-tz` for tz math; never `Date` alone

---

## 15. Error Handling & Edge Cases

### 15.1 Critical edge cases (MUST handle in MVP)
| Case | Behavior |
|---|---|
| Member tries to view group they were removed from | Return 403; show "You're no longer in this group" toast |
| Owner tries to leave group (not transfer) | Block; show "Transfer ownership first" |
| Last member of a group | Allow leaving → group is auto-deleted with confirmation |
| Invite token expired | Landing page shows "This invite has expired. Ask the owner for a new one." |
| Invite token already used (max-uses reached) | Same UX as expired |
| Invite token revoked | Same UX as expired |
| User RSVPs then leaves group | RSVP is removed (cascading), event stays |
| Event creator removed from group | Their personal_shared events stay; ownership moves to group owner |
| Event creator removed from group (group_shared events) | Event stays; group owner becomes creator |
| Recurring event series, deletion | Soft-delete the parent → all future instances disappear; past instances remain |
| Concurrent edits to an event | Last-write-wins; show toast "Updated by Anna 5s ago" if conflict detected |
| User deletes their Clerk account | Hard-delete `users` row's PII (name, email, avatar) but keep `userId` referenced from events/comments/RSVPs as a "Deleted user" tombstone; their `personal_shared` events stay (creator shown as "Deleted user"); their `group_shared` events stay; comments remain attributed to "Deleted user" |
| User was the sole owner of multiple groups when deleting account | Block deletion until they transfer or delete those groups (Clerk pre-delete webhook + UI flow) |

### 15.2 User-facing error states
- Empty states: every list (groups, events, notifications, find-free-day results) has a tailored empty state with an action
- Network errors: full-screen retry; for inline actions, toast with retry button
- Permission errors: redirect with explanation, never silent failure

### 15.3 Validation (server-enforced)
- Title 1–100 chars
- Description ≤ 2000 chars
- Group name 1–50 chars, group description ≤ 280 chars
- Comment body 1–1000 chars
- Event end > start
- Recurrence range ≤ 1 year for queries
- Color must be valid hex

### 15.4 Rate limits
- Invite generation: max 5 active per group
- Event creation: max 100 per user per day
- Comments: max 30 per user per minute

---

## 16. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | RSC for invite landing page (OG previews) |
| Language | TypeScript (strict mode) | |
| Styling | Tailwind CSS + shadcn/ui | shadcn for primitives (Dialog, Sheet, Popover) |
| State | Convex reactive queries | No Redux/Zustand needed for server state |
| Forms | React Hook Form + Zod | |
| Calendar UI | Custom built on `react-day-picker` | Mobile-tuned; FullCalendar too desktop-heavy |
| QR generation | `qrcode` (server-side in a Convex action) | Returns SVG |
| Backend / DB | Convex | Reactive queries, mutations, actions |
| Auth | Clerk + Convex `auth.config.ts` integration | |
| Email | Resend + React Email | |
| Date / Timezone | `luxon` or `date-fns-tz` | Pick one in implementation |
| RRULE | `rrule` (npm) | RFC 5545 compliant |
| Hosting | Vercel (frontend) + Convex Cloud (backend) | |
| PWA | `next-pwa` or hand-rolled manifest + service worker | |
| Analytics | PostHog (Phase 2) | |
| Error tracking | Sentry (Phase 2) | |

### 16.1 Project structure (proposed)
```
decssy/
  app/                          # Next.js App Router
    (marketing)/page.tsx        # Landing page
    join/[token]/page.tsx       # Invite landing (public, server-rendered)
    (app)/
      layout.tsx                # Bottom-tab nav layout
      calendar/page.tsx
      groups/
        page.tsx
        [id]/page.tsx
        [id]/invite/page.tsx
      find/page.tsx
      inbox/page.tsx
      settings/page.tsx
    api/qr/[token]/route.ts     # QR image endpoint (for OG previews)
  components/
    calendar/
    events/
    groups/
    primitives/                 # shadcn-extended
  convex/
    schema.ts
    auth.config.ts
    users.ts                    # mutations + queries
    groups.ts
    events.ts
    invites.ts
    notifications.ts
    findFreeDay.ts              # the algorithm
    lib/
      enums.ts                  # the source-of-truth config map
      requireMember.ts
      recurrence.ts
      timezone.ts
  lib/
    clerk.ts
    useGroupColor.ts
  public/
    manifest.json               # PWA
  next.config.ts
  tailwind.config.ts
```

---

## 16.5 Design System (Locked — "Peach Fuzz")

Source: design handoff dated 2026-05-07 in `design_handoff_decssy/`. All values below are locked unless flagged in §19. Wireframes in §9 use the schematic style; visual rendering follows the tokens here.

### 16.5.1 Color tokens

| Token | Hex | Use |
|---|---|---|
| `bg` | `#fdf7f2` | App background |
| `surface` | `#ffffff` | Cards, sheets, raised elements |
| `surface-2` | `#f5ece4` | Subtle inset surfaces, comment author avatars |
| `border` | `#ecddd3` | All borders |
| `text` | `#2c1f17` | Primary text, headings |
| `text-muted` | `#9a7b6a` | Secondary text, labels, timestamps |
| `accent` | `#e8519a` | Brand color — primary buttons, FAB, active states |
| `accent-soft` | `rgba(232,81,154,0.12)` | Tinted backgrounds, soft pills |
| `positive` | `#3aab6e` | RSVP "Going", success states |
| `maybe` | `#e8a530` | RSVP "Maybe", warning states |
| `negative` | `#e04f4f` | RSVP "Can't go", destructive actions, error states |

### 16.5.2 Group color palette (8 colors)

```ts
export const GROUP_COLORS = [
  "#10B981", // emerald
  "#6366F1", // indigo
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#84CC16", // lime
] as const;
```

All hit WCAG AA 4.5:1 on the `bg` surface. Group color is used for: group icons (with `${color}22` tint background), event chips left-bar, calendar event dots, filter chips when active.

### 16.5.3 Typography

- **Family**: Plus Jakarta Sans via Google Fonts
- **Weights loaded**: 500, 600, 700, 800, 900
- **Mobile scale**: 11 / 12 / 13 / 14 / 15 / 17 / 20 / 24 (px)
- **Default body**: 13px / weight 500 / line-height 1.5
- **Default heading**: weight 800–900 / letter-spacing -0.3px

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
```

### 16.5.4 Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | `10px` | Filter chips, small buttons |
| `radius-md` | `14px` | Form inputs, segmented controls |
| `radius-lg` | `20px` | Cards, list items |
| `radius-xl` | `24px` | Calendar grid card, hero cards |
| `radius-sheet` | `28px 28px 0 0` | Bottom sheet (top corners only) |
| `radius-pill` | `9999px` | Avatars, status pills, color dots |

### 16.5.5 Shadows

| Token | Value |
|---|---|
| `shadow-sm` | `0 2px 16px rgba(44,31,23,0.08)` |
| `shadow-md` | `0 4px 24px rgba(44,31,23,0.12)` |
| `shadow-fab` | `0 6px 20px rgba(232,81,154,0.32)` |
| `shadow-nav` | `0 -4px 20px rgba(44,31,23,0.06)` |

### 16.5.6 Spacing scale (4px base)

`4 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 48 · 64`

### 16.5.7 Layout & navigation

- **Bottom nav**: 64px height + `env(safe-area-inset-bottom)`; white surface; top border 1.5px solid `border`; `shadow-nav`
- **Active tab**: icon in 44×36px pill with `accent-soft` background; label 10px / weight 800 in accent
- **Inactive tab**: icon and label in `text-muted`
- **FAB**: 52×52px circle, accent background, `shadow-fab`, positioned 88px from bottom + 16px from right
- **Mobile breakpoint**: 320–767px → bottom-tab nav, full-width screens, bottom sheets
- **Tablet breakpoint**: 768–1023px → left sidebar (240px), two-pane where useful, sheets become side drawers
- **Desktop breakpoint**: 1024px+ → sidebar + persistent agenda panel; modals replace sheets

### 16.5.8 Motion

- **Hover/state**: 150ms ease-out
- **Layout shifts**: 250ms ease-in-out
- **Bottom sheets**: 300ms `cubic-bezier(0.32, 0.72, 0, 1)` (iOS spring)
- **RSVP count change**: scale pop 1.0 → 1.12 → 1.0 over 200ms
- **Never animate**: the calendar grid itself (read-only motion is OK on event chips)

### 16.5.9 Icons

- **Library**: Lucide
- **Default**: 24px, 1.5px stroke
- **In dense lists**: 16px
- **Notification icons** (per type): `rsvp` ✓ · `comment` 💬 · `join` 👋 · `update` ✏️ · `event` 📅

### 16.5.10 Tailwind config (translation guide)

Convert tokens to `tailwind.config.ts`:

```ts
extend: {
  colors: {
    bg: "#fdf7f2",
    surface: "#ffffff",
    "surface-2": "#f5ece4",
    border: "#ecddd3",
    text: "#2c1f17",
    "text-muted": "#9a7b6a",
    accent: { DEFAULT: "#e8519a", soft: "rgba(232,81,154,0.12)" },
    positive: "#3aab6e",
    maybe: "#e8a530",
    negative: "#e04f4f",
  },
  borderRadius: { sm: "10px", md: "14px", lg: "20px", xl: "24px" },
  fontFamily: { sans: ['"Plus Jakarta Sans"', "sans-serif"] },
  boxShadow: {
    sm: "0 2px 16px rgba(44,31,23,0.08)",
    md: "0 4px 24px rgba(44,31,23,0.12)",
    fab: "0 6px 20px rgba(232,81,154,0.32)",
    nav: "0 -4px 20px rgba(44,31,23,0.06)",
  },
}
```

### 16.5.11 Implementation note

The handoff prototype uses inline `style={...}` for prototyping speed — DO NOT port these directly. Convert all tokens to Tailwind utility classes during implementation. The tokens above are the canonical values; the prototype is a reference.

---

## 17. MVP Scope & Phasing

### 17.1 MVP (Phase 1) — what ships
**Goal: a fully usable single-group experience, working across phones and tablets.**

- Sign-up, onboarding, profile/settings
- Group create / join via QR or link / member list / leave / transfer / delete
- Personal-shared and group-shared events
- All-day and timed events
- Recurring events (daily/weekly/monthly/yearly + edit semantics)
- RSVP system with real-time propagation
- Event comments
- Calendar (month + agenda) with color-coded groups, filter, swipe nav
- Find Free Day
- In-app + email notifications (5 default types, all toggleable)
- PWA installability
- Mobile-first responsive (320px → tablet)
- Timezones (UTC + IANA correctness)

**MVP success criteria:**
- A user can create a group, share a QR with 3 friends, all 3 can scan-and-join in <60s
- A user can post an event with recurrence, friends RSVP, the calendar updates live
- Find Free Day returns useful results for a 5-person group across a 14-day range in <500ms
- Works smoothly on iPhone Safari, Android Chrome, iPad, desktop

### 17.2 Phase 2 — what comes next
- Polling (Doodle-style date proposals → vote → finalize → auto-create event)
- Web push notifications (PWA)
- Apple Sign In
- `userBusyCache` for Find Free Day perf at scale
- Per-user custom reminders ("remind me 1 hour before")
- Group history view (filtered audit log)
- Improved onboarding (sample group, tutorial)

### 17.3 Phase 3 — backlog
- `.ics` calendar export / Google Calendar subscribe
- Multi-role groups (admin role for clubs/teams >10 members)
- Event location / map embed
- File attachments on events
- Translations / i18n
- Native iOS/Android apps (if PWA constraints become limiting)

---

## 18. Out of Scope (YAGNI for MVP)

- Public event discovery (this is a private-groups product)
- Direct messaging between users (it's not a chat app)
- Calendar sync with Google/Outlook/Apple (Phase 3)
- Video calls / meeting integrations
- Payments / RSVP fees
- Custom themes beyond group colors
- Custom RSVP statuses ("tentative-going", etc.)
- Sub-groups / nested groups
- Public profiles
- Activity feeds beyond notifications

---

## 19. Open Questions / Decisions Deferred

Updated 2026-05-07 after design handoff review. Items split into two groups: **design follow-ups** that should be resolved before implementation starts, and **product questions** that don't block implementation but need answers before launch.

### 19.1 Design follow-ups (resolve before implementation kickoff)

| # | Gap | Priority | Action |
|---|---|---|---|
| 1 | **Missing screens** — Sign in/Sign up branding, Member detail (sheet), Profile, Settings | P1 | Request from designer |
| 2 | **No tablet mockups** — only mobile shown for any screen | P1 | Request tablet variants for at least Calendar (home) and Event detail; other screens extrapolate |
| 3 | **No empty / loading / error states** | P1 | Request for Calendar, Group list, Notifications, Find Free Day; loading skeletons can be inferred |
| 4 | **Recurrence picker oversimplified** — design has only "Doesn't repeat / Every day / Every week / Every month / Every year"; PRD §13.4 specifies weekday-specific weekly, monthly-by-weekday, and end conditions | P1 | Decide: expand picker (recommended) OR explicitly defer advanced recurrence to Phase 2 in scope (§17) |
| 5 | **Filter chips on Calendar are single-select in JSX** but PRD §5.4 implies multi-select | P2 | Change to `Set<groupId>`; trivial during impl |
| 6 | **Focus rings not shown** in design | P2 | Add Tailwind `focus-visible:ring-2 ring-accent` to all interactive elements during impl |
| 7 | **Description card on event detail** — design spec says wrap in surface card; mock data shows inline | P2 | Confirm with designer; small detail |
| 8 | **Avatar upload UI** — not designed; profile uses initials only | P3 | Defer to Phase 2; initials-only is fine for MVP |

### 19.2 Product questions (answer before launch, not blocking implementation)

1. **Onboarding fork** — should we ask the user to "create a group OR enter an invite" before the calendar is shown, or let them land on an empty calendar with both as CTAs? (Design currently shows the fork screen; lock if approved.)
2. **Email batching window** — 5 minutes is a starting point. Tune in beta.
3. **Comment author replies / @mentions** — currently no thread model. May want lightweight "@mention" support to notify a specific person without spamming all attendees.
4. **Group join cap** — should there be a max members per group at MVP? Suggest 50 (covers all "small group" use cases) so we don't accidentally serve scenarios we haven't designed for.
5. **Domain name** — is `decssy.app` available/intended, or is this a placeholder? (Affects invite link UX, OG metadata, brand collateral.)
6. **Custom group color** — Phase 2 question: should owners be able to enter a custom hex when the 8 presets feel limiting? Defer until we have data on how often users hit the limit.

---

## 20. Success Metrics (proposed)

### 20.1 Activation (first 7 days)
- % of new users who join or create at least one group: **target ≥80%**
- % of new users who post at least one event: **target ≥60%**
- % of group invites that result in a successful join: **target ≥40%**

### 20.2 Engagement (post-activation)
- Median events viewed per user per week: **target ≥10**
- % of users who use Find Free Day at least once: **target ≥30%**
- % of weekly active users who RSVP to at least one event: **target ≥70%**

### 20.3 Health
- 7-day retention: **target ≥40%**
- 30-day retention: **target ≥25%**
- p95 calendar load: **target <800ms on 4G**

---

## 21. Glossary

| Term | Meaning |
|---|---|
| **Group** | A named collection of users sharing a calendar |
| **Owner** | The single user who manages a group |
| **Member** | Any user (incl. owner) in a group |
| **personal_shared** | Event owned by one person, broadcast to a group; supports RSVP |
| **group_shared** | Event owned by the group; all members auto-attend |
| **Invite token** | A random, URL-safe string that grants single-use group access |
| **RRULE** | Recurrence rule per RFC 5545; encodes patterns like "every Mon" |
| **Soft delete** | Marks a row deleted (`deletedAt`) without removing it; queries filter |
| **Bottom sheet** | Mobile UI pattern — drawer slides up from bottom edge |

---

## 22. Document History

| Date | Version | Author | Changes |
|---|---|---|---|
| 2026-05-07 | v1.0 | Marvin (with Claude) | Initial PRD from brainstorming session |
| 2026-05-07 | v1.1 | Marvin (with Claude) | Added §16.5 Design System (locked tokens from "Peach Fuzz" handoff); decisions §6 rows 15–20 added; §19 Open Questions split into design follow-ups (P1–P3) and product questions; document title row above shows the date of locks |

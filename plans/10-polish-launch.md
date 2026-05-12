# Plan 10: Polish & Launch — Implementation Plan

> Final plan. Yolo compact. Focus: ship-ability over completeness.

**Goal:** make the app deploy-ready. Resend email integration, per-type notification preferences, a Settings page, and Vercel deploy prep + user-side checklist.

**Scope:**
1. Schema: `notificationPreferences` field on `users` (optional record of per-type email opt-out flags)
2. `convex/email.ts`: Resend wrapper, env-gated, "use node" action
3. `convex/crons.ts`: every 1 minute, picks up notifications with `emailSentAt === undefined` and sends email if the recipient hasn't opted out
4. `/settings` page (new): notification toggles per type + sign-out button (moves the sign-out from PlaceholderScreen here)
5. Profile menu accessible from any tab → settings link
6. Vercel deploy config + user-side checklist (no automated deploy — user does it)

**Out of scope (genuinely v2):**
- Per-instance recurrence overrides (Plan 7 deferral)
- PWA push notifications (separate provider needed)
- `.ics` export
- Accessibility audit (recommend manual + Lighthouse pass after deploy)
- Comprehensive empty/loading state pass

---

## Tasks

### Task 1: Schema — notification preferences

Add to `users` schema extension:

```typescript
notificationEmailPrefs: v.optional(
  v.object({
    event_invite: v.optional(v.boolean()),
    event_updated: v.optional(v.boolean()),
    event_cancelled: v.optional(v.boolean()),
    comment_added: v.optional(v.boolean()),
    invite_accepted: v.optional(v.boolean()),
    ownership_transferred: v.optional(v.boolean()),
  }),
),
```

Defaults (when prefs are undefined or the key is undefined): email on for invite/updated/cancelled/invite_accepted/ownership_transferred; OFF for `comment_added` (high noise per PRD §12.4).

### Task 2: `convex/email.ts` — Resend wrapper

`"use node"` action `sendEmail` that:
- Reads `AUTH_RESEND_API_KEY` from Convex env
- If unset → `console.log` the payload and return (so the cron doesn't crash in dev)
- If set → POST to `https://api.resend.com/emails`

### Task 3: `convex/crons.ts` — periodic email send

Internal action `processEmailQueue`:
- Query notifications with `emailSentAt === undefined` ordered by createdAt asc, limit 50
- For each: check recipient's `notificationEmailPrefs[type]` (defaulting per Task 1 rules)
- If pref says yes AND we have the recipient's email → call sendEmail
- Mark `emailSentAt: Date.now()` regardless (don't retry; if Resend failed, the log records it)

Register cron via `crons.interval("process emails", { minutes: 1 }, internal.email.processEmailQueue)`.

### Task 4: `convex/users.ts` — updateNotificationPrefs mutation

```typescript
export const updateNotificationPrefs = mutation({
  args: { prefs: <inline object validator> },
  handler: async (ctx, { prefs }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    await ctx.db.patch(userId, { notificationEmailPrefs: prefs });
  },
});
```

### Task 5: /settings page

Routes: `app/(app)/settings/page.tsx` — auth-protected via existing middleware (already protected by isProtectedRoute matcher).

UI:
- Profile header (name, email — pulled from useCurrentUser)
- Notifications section: 6 toggles, one per type, with friendly labels
- Sign out button at the bottom (uses SignOutButton from Plan 1)

### Task 6: Profile/settings access from app shell

Add a settings cog icon to the calendar page header (next to the brand wordmark). Tap → /settings.

### Task 7: Vercel deploy config

- `.vercelignore` already exists (from Plan 1) — verify it excludes plans/, design_handoff_decssy/, etc.
- `next.config.ts` — verify PWA headers still present
- Document in README a Vercel deploy section with the exact 6 steps (Google OAuth prod URL, Convex prod env, Vercel project + env vars, etc.)

### Task 8: README — final polish + launch checklist

Mark Plan 10 done. Add a "Deploy to Vercel" section. Add a "What ships" section listing the full feature set so the user can use it as marketing copy.

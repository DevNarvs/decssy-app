# Plan 2: Onboarding & Groups — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in user can complete a 3-step onboarding (welcome → set name/timezone → first action), then create, view, edit, and delete their own groups. The Groups tab becomes functional. Multi-member features (invites, transfer ownership) ship in Plan 3.

**Architecture:** Onboarding lives at `/welcome` as a 3-page wizard (URL-driven so back/refresh works). Middleware redirects newly-signed-in users to `/welcome` until `users.onboardedAt` is set. Group CRUD lives under `/groups/...` routes backed by Convex queries and mutations in `convex/groups.ts`. Permission checks use a shared `requireOwner` / `requireMember` helper to keep them consistent. UI follows Peach Fuzz tokens.

**Tech Stack** (no new dependencies — everything Plan 1 already installed):
- Next.js 16 App Router (server + client components mixed)
- Convex (queries, mutations, indexes)
- React Hook Form + Zod for form validation
- Lucide icons + Tailwind utility classes from Plan 1
- Playwright e2e tests on Pixel 7 Chromium

**Prerequisites:** Plan 1 complete. `convex dev` and `next dev` both runnable. Auth working (Google or password). 1+ signed-in test account.

---

## Plan 1 lessons applied

1. After **every** Convex file change, run `npx convex dev --once` to regenerate `convex/_generated/`. Otherwise TypeScript can't find new functions.
2. Don't run `npx @convex-dev/auth` again — if you do, immediately follow with `npx convex env remove CUSTOM_AUTH_SITE_URL` (Plan 1 gotcha).
3. Tailwind 4 syntax: design tokens in `@theme {}` blocks in `globals.css`. No `tailwind.config.ts`.
4. Strict TS: `noUncheckedIndexedAccess: true` — `arr[0]` is `T | undefined`, not `T`. Handle accordingly.
5. Auth user identity: `const userId = await getAuthUserId(ctx)` in Convex functions; nullable, check before use.
6. Form-state navigation pattern from Plan 1's AuthForm: drive navigation from server state via `useEffect`, not from try/catch.

---

## File structure (delta from Plan 1)

```
decssy/
├─ app/
│  ├─ (app)/
│  │  ├─ groups/
│  │  │  ├─ page.tsx                    ← REWRITTEN (was placeholder)
│  │  │  ├─ new/page.tsx                ← NEW
│  │  │  └─ [id]/
│  │  │     ├─ page.tsx                 ← NEW
│  │  │     └─ settings/page.tsx        ← NEW
│  ├─ welcome/                          ← NEW (no (app) prefix — own layout)
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                       (step 0: welcome)
│  │  ├─ profile/page.tsx               (step 1: name + timezone)
│  │  └─ start/page.tsx                 (step 2: create-or-join)
├─ components/
│  ├─ groups/
│  │  ├─ ColorPicker.tsx                ← NEW (8 group colors)
│  │  ├─ GroupCard.tsx                  ← NEW (list item)
│  │  ├─ GroupHero.tsx                  ← NEW (detail header)
│  │  ├─ MemberList.tsx                 ← NEW
│  │  ├─ GroupSettingsForm.tsx          ← NEW
│  │  └─ DangerZone.tsx                 ← NEW (leave/delete buttons)
│  ├─ onboarding/
│  │  ├─ StepIndicator.tsx              ← NEW (3-dot progress)
│  │  └─ WelcomeCard.tsx                ← NEW (similar to AuthCard)
│  └─ ui/
│     └─ EmptyState.tsx                 ← NEW (reusable)
├─ convex/
│  ├─ schema.ts                         ← MODIFIED (add onboardedAt to users)
│  ├─ groups.ts                         ← NEW (createGroup, listMyGroups, getGroup, updateGroup, leaveGroup, deleteGroup)
│  ├─ users.ts                          ← MODIFIED (add completeOnboarding mutation)
│  └─ lib/
│     ├─ permissions.ts                 ← NEW (requireMember, requireOwner)
│     └─ groupColors.ts                 ← NEW (the 8 hex values + type)
├─ lib/
│  └─ hooks/
│     └─ useCurrentUser.ts              ← NEW (reactive useQuery wrapper)
├─ middleware.ts                        ← MODIFIED (redirect to /welcome if not onboarded)
└─ tests/
   └─ e2e/
      └─ groups.spec.ts                 ← NEW (5 tests)
```

---

## Task 0: Pre-flight verification

- [ ] **Step 1: Confirm clean slate**

Run:
```bash
git status
```
Expected: `nothing to commit, working tree clean` on `main`. If not, stash or commit before proceeding.

- [ ] **Step 2: Confirm Plan 1 state**

Run:
```bash
npm test 2>&1 | tail -5
PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test --reporter=list 2>&1 | tail -3
```
Expected: e2e tests pass (6/6). If they fail, fix Plan 1 first.

Make sure `npx convex dev` is running in a side terminal. Make sure `npm run dev` is running and you can hit http://localhost:3002.

---

## Task 1: Add `onboardedAt` to users schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add the field**

In `convex/schema.ts`, in the `users` table extension, add `onboardedAt`:

```typescript
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
  timezone: v.optional(v.string()),
  onboardedAt: v.optional(v.number()), // ms epoch — set once during onboarding completion
})
  .index("email", ["email"])
  .index("phone", ["phone"]),
```

- [ ] **Step 2: Verify Convex picks up the change**

Watch the `npx convex dev` terminal — should report "Convex functions ready!" within seconds. If you stopped the watcher, run:
```bash
npx convex dev --once
```

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add onboardedAt field to users for onboarding completion tracking"
```

---

## Task 2: `completeOnboarding` mutation in users.ts

**Files:**
- Modify: `convex/users.ts`

- [ ] **Step 1: Add the mutation**

Append to `convex/users.ts`:

```typescript
/**
 * Records onboarding completion. Idempotent — calling more than once
 * preserves the original onboardedAt. Updates name (from form) and
 * timezone (from form, defaults to browser-detected) at the same time.
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
    if (name.trim().length < 1 || name.trim().length > 50) {
      throw new Error("Name must be 1–50 characters");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User row missing — auth state likely stale");
    }
    const patch: { name: string; timezone: string; onboardedAt?: number } = {
      name: name.trim(),
      timezone,
    };
    if (user.onboardedAt === undefined) {
      patch.onboardedAt = Date.now();
    }
    await ctx.db.patch(userId, patch);
  },
});
```

- [ ] **Step 2: Regenerate types and verify**

```bash
npx convex dev --once
npx tsc --noEmit
```
Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add convex/users.ts
git commit -m "feat: completeOnboarding mutation for users (name + timezone + timestamp)"
```

---

## Task 3: `useCurrentUser` hook

**Files:**
- Create: `lib/hooks/useCurrentUser.ts`

- [ ] **Step 1: Write the hook**

Create `lib/hooks/useCurrentUser.ts`:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Reactive read of the current signed-in user.
 *
 * Returns:
 *   - `undefined` while loading
 *   - `null` if unauthenticated (shouldn't happen on protected routes;
 *     middleware redirects unauthed users to /sign-in)
 *   - `Doc<"users">` once loaded
 */
export function useCurrentUser(): Doc<"users"> | null | undefined {
  return useQuery(api.users.getCurrentUser);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/useCurrentUser.ts
git commit -m "feat: useCurrentUser hook (reactive Doc<users> | null | undefined)"
```

---

## Task 4: Middleware — redirect not-yet-onboarded users to /welcome

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Inspect current middleware**

Re-read `middleware.ts` to confirm its current state from Plan 1.

- [ ] **Step 2: Update to add /welcome route + onboarded-check**

Replace `middleware.ts` with:

```typescript
/**
 * Next.js middleware — Convex Auth route protection + onboarding gate.
 *
 * Routing rules:
 *   • Authenticated user hitting /sign-in or /sign-up → /calendar
 *   • Unauthenticated user hitting protected route → /sign-in
 *   • Authenticated but not-yet-onboarded user hitting protected (non-welcome)
 *     route → /welcome
 *   • Authenticated AND onboarded user hitting /welcome/* → /calendar
 *
 * Note on the onboarded check: middleware runs at the edge and can't easily
 * read Convex (no DB access). We use a lightweight cookie set during the
 * completeOnboarding mutation to skip the DB roundtrip. The cookie's value
 * is non-sensitive (just "1") — its presence alone signals onboarded.
 *
 * Fallback: client-side OnboardingGuard component double-checks for any
 * edge case where the cookie is stale or missing.
 */
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isWelcomePage = createRouteMatcher(["/welcome(.*)"]);
const isProtectedRoute = createRouteMatcher([
  "/calendar(.*)",
  "/groups(.*)",
  "/find(.*)",
  "/inbox(.*)",
  "/settings(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  if (isSignInPage(request) && isAuthed) {
    return nextjsMiddlewareRedirect(request, "/calendar");
  }

  if (isProtectedRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  // Onboarding gate (cookie-based)
  if (isAuthed) {
    const onboarded = request.cookies.get("decssy_onboarded")?.value === "1";

    if (!onboarded && isProtectedRoute(request)) {
      return nextjsMiddlewareRedirect(request, "/welcome");
    }
    if (onboarded && isWelcomePage(request)) {
      return nextjsMiddlewareRedirect(request, "/calendar");
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

- [ ] **Step 3: Verify build still passes**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat: middleware redirects pre-onboarding users to /welcome via cookie"
```

---

## Task 5: Group color constants

**Files:**
- Create: `convex/lib/groupColors.ts`

- [ ] **Step 1: Define the palette**

Create `convex/lib/groupColors.ts`:

```typescript
/**
 * The 8 locked group colors (PRD §16.5.2).
 * Used by both client (color picker UI) and server (validation).
 */
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

export type GroupColor = (typeof GROUP_COLORS)[number];

export function isValidGroupColor(hex: string): hex is GroupColor {
  return (GROUP_COLORS as readonly string[]).includes(hex);
}

/** Pretty name for screen-reader labels and palette tooltips. */
export const GROUP_COLOR_NAMES: Record<GroupColor, string> = {
  "#10B981": "Emerald",
  "#6366F1": "Indigo",
  "#F59E0B": "Amber",
  "#EF4444": "Red",
  "#EC4899": "Pink",
  "#06B6D4": "Cyan",
  "#8B5CF6": "Violet",
  "#84CC16": "Lime",
};
```

- [ ] **Step 2: Commit**

```bash
git add convex/lib/groupColors.ts
git commit -m "feat: 8 locked group colors with type + validator + names"
```

---

## Task 6: Permission helpers

**Files:**
- Create: `convex/lib/permissions.ts`

- [ ] **Step 1: Write the helpers**

Create `convex/lib/permissions.ts`:

```typescript
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
```

- [ ] **Step 2: Verify**

```bash
npx convex dev --once
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add convex/lib/permissions.ts
git commit -m "feat: requireUser/requireMember/requireOwner shared permission helpers"
```

---

## Task 7: `createGroup` mutation

**Files:**
- Create: `convex/groups.ts`

- [ ] **Step 1: Write the file**

Create `convex/groups.ts`:

```typescript
/**
 * Group-related queries and mutations.
 * Permission checks delegate to convex/lib/permissions.ts.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { isValidGroupColor } from "./lib/groupColors";
import {
  requireUser,
  requireMember,
  requireOwner,
} from "./lib/permissions";

const NAME_MIN = 1;
const NAME_MAX = 50;
const DESCRIPTION_MAX = 280;

/**
 * Create a new group with the caller as owner + first member.
 * Returns the new group's id.
 */
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
  },
  handler: async (ctx, { name, description, color }) => {
    const userId = await requireUser(ctx);

    const trimmedName = name.trim();
    if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
      throw new Error(`Name must be ${NAME_MIN}–${NAME_MAX} characters`);
    }
    if (description !== undefined && description.length > DESCRIPTION_MAX) {
      throw new Error(`Description max ${DESCRIPTION_MAX} characters`);
    }
    if (!isValidGroupColor(color)) {
      throw new Error("Invalid color — must be one of the 8 palette values");
    }

    const groupId = await ctx.db.insert("groups", {
      name: trimmedName,
      description: description?.trim() || undefined,
      color,
      ownerId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      joinedAt: Date.now(),
    });

    return groupId;
  },
});
```

- [ ] **Step 2: Verify**

```bash
npx convex dev --once
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/groups.ts
git commit -m "feat: createGroup mutation with validation + auto-membership"
```

---

## Task 8: `listMyGroups` query

**Files:**
- Modify: `convex/groups.ts`

- [ ] **Step 1: Add the query**

Append to `convex/groups.ts`:

```typescript
/**
 * Returns groups the caller is a member of, with member counts.
 * Sorted by `createdAt` descending (most recently created first).
 */
export const listMyGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    // Step 1: Get all memberships for this user.
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Step 2: Resolve each membership to its group + count members.
    const results: Array<{
      group: Doc<"groups">;
      memberCount: number;
      isOwner: boolean;
    }> = [];

    for (const m of memberships) {
      const group = await ctx.db.get(m.groupId);
      if (!group) continue; // tolerate dangling memberships (shouldn't happen)
      const memberCount = (
        await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect()
      ).length;
      results.push({
        group,
        memberCount,
        isOwner: group.ownerId === userId,
      });
    }

    // Newest first.
    results.sort((a, b) => b.group.createdAt - a.group.createdAt);

    return results;
  },
});
```

- [ ] **Step 2: Verify**

```bash
npx convex dev --once
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add convex/groups.ts
git commit -m "feat: listMyGroups query with member counts + owner flag"
```

---

## Task 9: `getGroup` query

**Files:**
- Modify: `convex/groups.ts`

- [ ] **Step 1: Add the query**

Append to `convex/groups.ts`:

```typescript
/**
 * Returns full group detail including members. 403s (throws) if the caller
 * isn't a member of the group.
 */
export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await requireMember(ctx, groupId);

    const group = await ctx.db.get(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    // Hydrate members with their user record.
    const members: Array<{
      userId: Id<"users">;
      name: string;
      email: string;
      joinedAt: number;
      isOwner: boolean;
      isYou: boolean;
    }> = [];
    for (const m of memberships) {
      const u = await ctx.db.get(m.userId);
      if (!u) continue;
      members.push({
        userId: m.userId,
        name: u.name ?? u.email ?? "Anonymous",
        email: u.email ?? "",
        joinedAt: m.joinedAt,
        isOwner: m.userId === group.ownerId,
        isYou: m.userId === userId,
      });
    }
    // Owner first, then by joinedAt ascending (oldest first).
    members.sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return a.joinedAt - b.joinedAt;
    });

    return {
      group,
      members,
      isOwner: group.ownerId === userId,
    };
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/groups.ts
npx convex dev --once
git commit -m "feat: getGroup query with hydrated members + owner-first sort"
```

---

## Task 10: `updateGroup`, `leaveGroup`, `deleteGroup` mutations

**Files:**
- Modify: `convex/groups.ts`

- [ ] **Step 1: Append all three mutations**

Append to `convex/groups.ts`:

```typescript
/**
 * Owner-only edit of name / description / color. Any subset of args is allowed.
 */
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { groupId, name, description, color }) => {
    await requireOwner(ctx, groupId);

    const patch: { name?: string; description?: string; color?: string } = {};

    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
        throw new Error(`Name must be ${NAME_MIN}–${NAME_MAX} characters`);
      }
      patch.name = trimmed;
    }
    if (description !== undefined) {
      if (description.length > DESCRIPTION_MAX) {
        throw new Error(`Description max ${DESCRIPTION_MAX} characters`);
      }
      patch.description = description.trim() || undefined;
    }
    if (color !== undefined) {
      if (!isValidGroupColor(color)) {
        throw new Error("Invalid color");
      }
      patch.color = color;
    }

    await ctx.db.patch(groupId, patch);
  },
});

/**
 * Non-owner leaves a group. Owner cannot leave — they must transfer
 * ownership first (Plan 3) or delete the group.
 */
export const leaveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await requireMember(ctx, groupId);
    const group = await ctx.db.get(groupId);
    if (!group) {
      throw new Error("Group not found");
    }
    if (group.ownerId === userId) {
      throw new Error(
        "Owners can't leave — delete the group or transfer ownership first",
      );
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId),
      )
      .unique();
    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

/**
 * Owner-only deletion. Cascades to groupMembers (currently the only
 * dependent table — future plans add events/comments/invites which will
 * extend this cascade).
 */
export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await requireOwner(ctx, groupId);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(groupId);
  },
});
```

- [ ] **Step 2: Verify and commit**

```bash
npx convex dev --once
npx tsc --noEmit
git add convex/groups.ts
git commit -m "feat: updateGroup, leaveGroup, deleteGroup mutations with permission checks"
```

---

## Task 11: WelcomeCard component

**Files:**
- Create: `components/onboarding/WelcomeCard.tsx`

- [ ] **Step 1: Build it**

Create `components/onboarding/WelcomeCard.tsx`:

```tsx
import { cn } from "@/lib/utils";

/**
 * Peach Fuzz styled card wrapper for onboarding steps.
 * Mirrors AuthCard's layout/styling for visual consistency.
 */
interface WelcomeCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function WelcomeCard({
  title,
  subtitle,
  children,
  className,
}: WelcomeCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div
        className={cn(
          "w-full max-w-sm rounded-xl bg-surface px-6 py-8 shadow-sm",
          className,
        )}
      >
        <div className="mb-6 text-center text-3xl font-extrabold tracking-tight text-text">
          Decssy<span className="text-accent">.</span>
        </div>

        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-text">
          {title}
        </h1>
        {subtitle && (
          <p className="mb-6 text-base text-text-muted">{subtitle}</p>
        )}

        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/WelcomeCard.tsx
git commit -m "feat: WelcomeCard wrapper for onboarding steps"
```

---

## Task 12: StepIndicator (3-dot progress)

**Files:**
- Create: `components/onboarding/StepIndicator.tsx`

- [ ] **Step 1: Build it**

Create `components/onboarding/StepIndicator.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  current: 0 | 1 | 2;
  totalSteps?: 3;
}

export function StepIndicator({ current, totalSteps = 3 }: StepIndicatorProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${current + 1} of ${totalSteps}`}
      className="my-6 flex items-center justify-center gap-2"
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              isActive ? "w-6 bg-accent" : "w-1.5",
              !isActive && (isPast ? "bg-accent/40" : "bg-border"),
            )}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/StepIndicator.tsx
git commit -m "feat: StepIndicator 3-dot progress bar for onboarding"
```

---

## Task 13: `/welcome` step 0 (welcome screen)

**Files:**
- Create: `app/welcome/layout.tsx`
- Create: `app/welcome/page.tsx`

- [ ] **Step 1: Layout**

Create `app/welcome/layout.tsx`:

```tsx
/**
 * Onboarding layout — no nav, no surrounding chrome.
 * Each step is a focused single-card screen.
 */
export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Step 0 page**

Create `app/welcome/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

export default function WelcomeStep0Page() {
  return (
    <WelcomeCard
      title="Welcome to Decssy."
      subtitle="A shared calendar for the group chat. Let's set up your account."
    >
      <StepIndicator current={0} />

      <Link
        href="/welcome/profile"
        className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Get started →
      </Link>
    </WelcomeCard>
  );
}
```

- [ ] **Step 3: Verify and commit**

Open http://localhost:3002 in incognito (or sign out and sign back in with a fresh test account that hasn't onboarded). Expected: redirected to `/welcome` showing the welcome card with step 0 indicator.

```bash
git add app/welcome/layout.tsx app/welcome/page.tsx
git commit -m "feat: /welcome step 0 — welcome screen with Get started CTA"
```

---

## Task 14: `/welcome/profile` (step 1 — name + timezone)

**Files:**
- Create: `app/welcome/profile/page.tsx`

- [ ] **Step 1: Build the form**

Create `app/welcome/profile/page.tsx`:

```tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WelcomeProfilePage() {
  const router = useRouter();
  const user = useCurrentUser();
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill once user loads.
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!timezone) {
        const detected =
          user.timezone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone ??
          "UTC";
        setTimezone(detected);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      setError("Please enter your name.");
      return;
    }
    if (trimmedName.length > 50) {
      setError("Name is too long (max 50 characters).");
      return;
    }
    if (!timezone) {
      setError("Please pick a timezone.");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({ name: trimmedName, timezone });
      // Set the cookie middleware uses to skip onboarding redirect.
      document.cookie = `decssy_onboarded=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      router.push("/welcome/start");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <WelcomeCard
      title="Tell us about you."
      subtitle="This helps us show the right times for your group's events."
    >
      <StepIndicator current={1} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-bold text-text-muted">
            Your name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            placeholder="Marvin"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="timezone"
            className="text-sm font-bold text-text-muted"
          >
            Timezone
          </label>
          <input
            id="timezone"
            type="text"
            required
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={isSubmitting}
            className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            placeholder="America/New_York"
          />
          <p className="text-sm text-text-muted">
            Auto-detected. Edit if it's wrong.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || user === undefined}
          className={cn(
            "mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Continue
        </button>
      </form>
    </WelcomeCard>
  );
}
```

- [ ] **Step 2: Verify and commit**

Open `/welcome` → click Get started → should reach `/welcome/profile`. Form pre-fills name from Google/Clerk, detects timezone. Submit → goes to `/welcome/start` (which 404s for now — that's the next task).

```bash
git add app/welcome/profile/page.tsx
git commit -m "feat: /welcome/profile step 1 — name + timezone form with auto-detect"
```

---

## Task 15: `/welcome/start` (step 2 — create or join)

**Files:**
- Create: `app/welcome/start/page.tsx`

- [ ] **Step 1: Build the choice screen**

Create `app/welcome/start/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Users, Mail } from "lucide-react";

export default function WelcomeStartPage() {
  return (
    <WelcomeCard
      title="What's next?"
      subtitle="Create your first group, or jump in with an invite from a friend."
    >
      <StepIndicator current={2} />

      <div className="flex flex-col gap-3">
        <Link
          href="/groups/new"
          className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent hover:bg-accent-soft"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Users size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="text-md font-extrabold text-text">
              Create a group
            </div>
            <div className="mt-0.5 text-sm text-text-muted">
              Start a shared calendar with your friends, family, or team.
            </div>
          </div>
        </Link>

        <button
          type="button"
          disabled
          className="group flex cursor-not-allowed items-start gap-3 rounded-lg border border-border bg-surface p-4 opacity-60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
            <Mail size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-md font-extrabold text-text">
              I have an invite link
            </div>
            <div className="mt-0.5 text-sm text-text-muted">
              Coming soon — invite links land in the next release.
            </div>
          </div>
        </button>

        <Link
          href="/calendar"
          className="mt-2 text-center text-sm font-bold text-text-muted hover:text-text"
        >
          Skip for now →
        </Link>
      </div>
    </WelcomeCard>
  );
}
```

- [ ] **Step 2: Verify and commit**

Navigate `/welcome` → Get started → fill profile → submit → land on `/welcome/start`. Click "Create a group" → 404 expected for now (Task 18). Click Skip → /calendar should work.

```bash
git add app/welcome/start/page.tsx
git commit -m "feat: /welcome/start step 2 — create-or-invite choice with skip option"
```

---

## Task 16: ColorPicker component (with tests)

**Files:**
- Create: `components/groups/ColorPicker.tsx`
- Create: `components/groups/ColorPicker.test.tsx`
- Modify: `vitest.config.ts` (if needed — should exist from Plan 1)
- Modify: `package.json` (add `test` script if missing)

- [ ] **Step 1: Confirm Vitest is set up (or set up)**

Check `package.json` scripts. If `"test": "vitest run"` is missing:

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Then add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

If `vitest.config.ts` doesn't exist, create it:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

And `tests/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing test**

Create `components/groups/ColorPicker.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ColorPicker } from "./ColorPicker";
import { GROUP_COLORS } from "@/convex/lib/groupColors";

describe("ColorPicker", () => {
  it("renders all 8 group colors", () => {
    render(<ColorPicker value={GROUP_COLORS[0]} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(8);
  });

  it("marks the selected color with aria-checked=true", () => {
    render(<ColorPicker value="#EC4899" onChange={() => {}} />);
    const pink = screen.getByRole("radio", { name: /pink/i });
    expect(pink).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the hex when a swatch is clicked", async () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#10B981" onChange={handleChange} />);
    await userEvent.click(screen.getByRole("radio", { name: /violet/i }));
    expect(handleChange).toHaveBeenCalledWith("#8B5CF6");
  });
});
```

- [ ] **Step 3: Run the test — should fail**

```bash
npm test -- ColorPicker
```
Expected: FAIL with "Cannot find module './ColorPicker'".

- [ ] **Step 4: Implement ColorPicker**

Create `components/groups/ColorPicker.tsx`:

```tsx
"use client";

import { GROUP_COLORS, GROUP_COLOR_NAMES, type GroupColor } from "@/convex/lib/groupColors";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: GroupColor) => void;
  disabled?: boolean;
}

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Group color"
      className="flex flex-wrap gap-2"
    >
      {GROUP_COLORS.map((color) => {
        const isSelected = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={GROUP_COLOR_NAMES[color]}
            disabled={disabled}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            className={cn(
              "relative h-9 w-9 rounded-sm transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isSelected
                ? "ring-2 ring-text ring-offset-2"
                : "hover:scale-110",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {isSelected && (
              <Check
                size={16}
                strokeWidth={3}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-sm"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run tests — should pass**

```bash
npm test -- ColorPicker
```
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/groups/ColorPicker.tsx components/groups/ColorPicker.test.tsx vitest.config.ts tests/setup.ts package.json package-lock.json
git commit -m "feat: ColorPicker component with 8-swatch radiogroup + Vitest tests"
```

---

## Task 17: GroupCreateForm (page + form component)

**Files:**
- Create: `app/(app)/groups/new/page.tsx`
- Create: `components/groups/GroupCreateForm.tsx`

- [ ] **Step 1: Form component**

Create `components/groups/GroupCreateForm.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ColorPicker } from "./ColorPicker";
import { GROUP_COLORS, type GroupColor } from "@/convex/lib/groupColors";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GroupCreateForm() {
  const router = useRouter();
  const createGroup = useMutation(api.groups.createGroup);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Default to first palette color; user can change.
  const [color, setColor] = useState<GroupColor>(GROUP_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 1) {
      setError("Please give your group a name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const groupId = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      router.push(`/groups/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create group.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      {/* Color preview as initial-based "avatar" */}
      <div className="flex justify-center">
        <div
          className="flex h-18 w-18 items-center justify-center rounded-xl text-3xl font-extrabold text-white shadow-sm"
          style={{ backgroundColor: color, width: 72, height: 72 }}
          aria-hidden="true"
        >
          {(name.trim().slice(0, 1) || "G").toUpperCase()}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-bold text-text-muted">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          placeholder="Family"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-bold text-text-muted"
        >
          Description{" "}
          <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={2}
          maxLength={280}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="rounded-md border border-border bg-surface px-3 py-2 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          placeholder="Our family group"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-text-muted">Color</label>
        <ColorPicker value={color} onChange={setColor} disabled={isSubmitting} />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-2 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
          "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Create group
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Page**

Create `app/(app)/groups/new/page.tsx`:

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GroupCreateForm } from "@/components/groups/GroupCreateForm";

export const metadata = { title: "New group · Decssy" };

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link
          href="/groups"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
          aria-label="Back"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-text">
          New group
        </h1>
      </header>

      <GroupCreateForm />
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

Navigate /welcome/start → "Create a group" → fill name + pick color → Create. Should redirect to `/groups/<id>` which 404s for now (Task 19).

```bash
git add components/groups/GroupCreateForm.tsx "app/(app)/groups/new/page.tsx"
git commit -m "feat: /groups/new — create group form with name/description/color"
```

---

## Task 18: GroupCard + EmptyState + /groups list page

**Files:**
- Create: `components/ui/EmptyState.tsx`
- Create: `components/groups/GroupCard.tsx`
- Modify: `app/(app)/groups/page.tsx` (replace placeholder)

- [ ] **Step 1: EmptyState**

Create `components/ui/EmptyState.tsx`:

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  className?: string;
}

export function EmptyState({ icon, title, description, cta, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </div>
      <div className="text-lg font-extrabold tracking-tight text-text">
        {title}
      </div>
      <p className="max-w-xs text-md text-text-muted">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-2 flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: GroupCard**

Create `components/groups/GroupCard.tsx`:

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface GroupCardProps {
  group: Doc<"groups">;
  memberCount: number;
  isOwner: boolean;
}

export function GroupCard({ group, memberCount, isOwner }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group._id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-lg font-extrabold text-white"
        style={{ backgroundColor: group.color }}
        aria-hidden="true"
      >
        {group.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-md font-extrabold text-text">
          {group.name}
        </div>
        <div className="truncate text-sm text-text-muted">
          {memberCount} {memberCount === 1 ? "member" : "members"}
          {isOwner && " · You're the owner"}
        </div>
      </div>
      <ChevronRight size={18} strokeWidth={1.5} className="text-text-muted" />
    </Link>
  );
}
```

- [ ] **Step 3: Replace placeholder /groups page**

Replace `app/(app)/groups/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { GroupCard } from "@/components/groups/GroupCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GroupsPage() {
  const groups = useQuery(api.groups.listMyGroups);

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Groups<span className="text-accent">.</span>
        </h1>
        <Link
          href="/groups/new"
          className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          <Plus size={14} strokeWidth={2.5} />
          New
        </Link>
      </header>

      {groups === undefined && (
        <div className="space-y-2 py-4" aria-busy="true">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-surface-2"
            />
          ))}
        </div>
      )}

      {groups && groups.length === 0 && (
        <EmptyState
          icon={<Users size={24} strokeWidth={1.5} />}
          title="No groups yet"
          description="Create your first group to start sharing calendars with friends or family."
          cta={{ label: "Create your first group", href: "/groups/new" }}
        />
      )}

      {groups && groups.length > 0 && (
        <ul className="space-y-2 pb-12">
          {groups.map(({ group, memberCount, isOwner }) => (
            <li key={group._id}>
              <GroupCard
                group={group}
                memberCount={memberCount}
                isOwner={isOwner}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify and commit**

Go to /groups → see empty state. Click "Create your first group" → create one → redirected to /groups/<id> (still 404). Manually navigate back to /groups → see the new group in the list.

```bash
git add components/ui/EmptyState.tsx components/groups/GroupCard.tsx "app/(app)/groups/page.tsx"
git commit -m "feat: /groups list page — EmptyState + GroupCard with member counts"
```

---

## Task 19: GroupHero + MemberList + Group detail page

**Files:**
- Create: `components/groups/GroupHero.tsx`
- Create: `components/groups/MemberList.tsx`
- Create: `app/(app)/groups/[id]/page.tsx`

- [ ] **Step 1: GroupHero**

Create `components/groups/GroupHero.tsx`:

```tsx
import type { Doc } from "@/convex/_generated/dataModel";

interface GroupHeroProps {
  group: Doc<"groups">;
  memberCount: number;
  isOwner: boolean;
}

export function GroupHero({ group, memberCount, isOwner }: GroupHeroProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl font-extrabold text-white"
          style={{ backgroundColor: group.color }}
          aria-hidden="true"
        >
          {group.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-text">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-0.5 text-sm text-text-muted">
              {group.description}
            </p>
          )}
          <p className="mt-1 text-sm text-text-muted">
            {memberCount} {memberCount === 1 ? "member" : "members"}
            {isOwner && " · You're the owner"}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: MemberList**

Create `components/groups/MemberList.tsx`:

```tsx
import type { Id } from "@/convex/_generated/dataModel";

interface Member {
  userId: Id<"users">;
  name: string;
  email: string;
  joinedAt: number;
  isOwner: boolean;
  isYou: boolean;
}

export function MemberList({
  members,
  groupColor,
}: {
  members: Member[];
  groupColor: string;
}) {
  return (
    <ul className="space-y-2">
      {members.map((m) => (
        <li
          key={m.userId}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-md font-extrabold text-white"
            style={{ backgroundColor: groupColor }}
            aria-hidden="true"
          >
            {m.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-md font-bold text-text">
              {m.name}
              {m.isYou && (
                <span className="ml-1.5 text-sm font-normal text-text-muted">
                  (you)
                </span>
              )}
            </div>
            <div className="truncate text-sm text-text-muted">{m.email}</div>
          </div>
          {m.isOwner && (
            <span className="rounded-sm bg-accent-soft px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-accent">
              Owner
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Detail page**

Create `app/(app)/groups/[id]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft, Settings } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GroupHero } from "@/components/groups/GroupHero";
import { MemberList } from "@/components/groups/MemberList";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const detail = useQuery(api.groups.getGroup, { groupId });

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe">
        <div className="my-12 h-32 animate-pulse rounded-xl bg-surface-2" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-surface-2"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link
          href="/groups"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h2 className="flex-1 truncate text-lg font-extrabold tracking-tight text-text">
          {detail.group.name}
        </h2>
        <Link
          href={`/groups/${groupId}/settings`}
          aria-label="Group settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <Settings size={16} strokeWidth={1.5} />
        </Link>
      </header>

      <div className="space-y-6">
        <GroupHero
          group={detail.group}
          memberCount={detail.members.length}
          isOwner={detail.isOwner}
        />

        <section>
          <h3 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
            Members ({detail.members.length})
          </h3>
          <MemberList members={detail.members} groupColor={detail.group.color} />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify and commit**

From /groups, click your group → see hero + member list (just you for now).

```bash
git add components/groups/GroupHero.tsx components/groups/MemberList.tsx "app/(app)/groups/[id]/page.tsx"
git commit -m "feat: /groups/[id] detail page with hero, member list, settings link"
```

---

## Task 20: Group settings page (rename, color, delete)

**Files:**
- Create: `components/groups/GroupSettingsForm.tsx`
- Create: `components/groups/DangerZone.tsx`
- Create: `app/(app)/groups/[id]/settings/page.tsx`

- [ ] **Step 1: GroupSettingsForm**

Create `components/groups/GroupSettingsForm.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ColorPicker } from "./ColorPicker";
import type { GroupColor } from "@/convex/lib/groupColors";
import { isValidGroupColor } from "@/convex/lib/groupColors";
import { cn } from "@/lib/utils";

export function GroupSettingsForm({ group }: { group: Doc<"groups"> }) {
  const updateGroup = useMutation(api.groups.updateGroup);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const initialColor = isValidGroupColor(group.color) ? group.color : (group.color as GroupColor);
  const [color, setColor] = useState<GroupColor>(initialColor);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setIsSubmitting(true);
    try {
      await updateGroup({
        groupId: group._id as Id<"groups">,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-bold text-text-muted">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={50}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          disabled={isSubmitting}
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-bold text-text-muted"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          maxLength={280}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSaved(false);
          }}
          disabled={isSubmitting}
          className="rounded-md border border-border bg-surface px-3 py-2 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-text-muted">Color</label>
        <ColorPicker
          value={color}
          onChange={(c) => {
            setColor(c);
            setSaved(false);
          }}
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
        >
          {error}
        </div>
      )}
      {saved && !error && (
        <div
          role="status"
          className="rounded-md bg-positive/10 px-3 py-2 text-sm font-bold text-positive"
        >
          Saved.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
          "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Save changes
      </button>
    </form>
  );
}
```

- [ ] **Step 2: DangerZone**

Create `components/groups/DangerZone.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface DangerZoneProps {
  groupId: Id<"groups">;
  isOwner: boolean;
  groupName: string;
}

export function DangerZone({ groupId, isOwner, groupName }: DangerZoneProps) {
  const router = useRouter();
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);
  const [pendingAction, setPendingAction] = useState<"leave" | "delete" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    if (!confirm(`Leave "${groupName}"? You'll need a new invite to rejoin.`))
      return;
    setError(null);
    setPendingAction("leave");
    try {
      await leaveGroup({ groupId });
      router.push("/groups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't leave group.");
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete "${groupName}"? This removes the group and all its members. This cannot be undone.`,
      )
    )
      return;
    setError(null);
    setPendingAction("delete");
    try {
      await deleteGroup({ groupId });
      router.push("/groups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete group.");
      setPendingAction(null);
    }
  }

  return (
    <div className="rounded-xl border border-negative/30 bg-negative/5 p-4">
      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-negative">
        Danger zone
      </h3>

      {error && (
        <div role="alert" className="mb-3 text-sm font-bold text-negative">
          {error}
        </div>
      )}

      {isOwner ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={pendingAction !== null}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-negative bg-surface text-md font-extrabold text-negative transition-colors hover:bg-negative/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative",
            pendingAction && "cursor-not-allowed opacity-60",
          )}
        >
          {pendingAction === "delete" && (
            <Loader2 size={16} className="animate-spin" />
          )}
          Delete this group
        </button>
      ) : (
        <button
          type="button"
          onClick={handleLeave}
          disabled={pendingAction !== null}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-negative bg-surface text-md font-extrabold text-negative transition-colors hover:bg-negative/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative",
            pendingAction && "cursor-not-allowed opacity-60",
          )}
        >
          {pendingAction === "leave" && (
            <Loader2 size={16} className="animate-spin" />
          )}
          Leave this group
        </button>
      )}

      {isOwner && (
        <p className="mt-2 text-sm text-text-muted">
          Owners can't leave — delete the group or transfer ownership (coming in
          the next release) first.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Settings page**

Create `app/(app)/groups/[id]/settings/page.tsx`:

```tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GroupSettingsForm } from "@/components/groups/GroupSettingsForm";
import { DangerZone } from "@/components/groups/DangerZone";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupSettingsPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const detail = useQuery(api.groups.getGroup, { groupId });

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe">
        <div className="space-y-3 py-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-md bg-surface-2"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link
          href={`/groups/${groupId}`}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-text">
          Settings
        </h1>
      </header>

      <div className="space-y-6">
        {detail.isOwner ? (
          <GroupSettingsForm group={detail.group} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 text-md text-text-muted">
            Only the group owner can edit settings.
          </div>
        )}

        <DangerZone
          groupId={groupId}
          isOwner={detail.isOwner}
          groupName={detail.group.name}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify and commit**

Navigate to /groups/<id> → click Settings → edit name → Save → see "Saved." → back → name updated in hero. Try Delete → confirm → land on /groups (empty again).

```bash
git add components/groups/GroupSettingsForm.tsx components/groups/DangerZone.tsx "app/(app)/groups/[id]/settings/page.tsx"
git commit -m "feat: group settings — edit name/description/color + leave/delete actions"
```

---

## Task 21: E2E tests for onboarding + groups flow

**Files:**
- Create: `tests/e2e/groups.spec.ts`

- [ ] **Step 1: Write the tests**

These tests require an authenticated user. We use Playwright's storageState to persist auth across runs once you've signed in once manually.

Create `tests/e2e/groups.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

/**
 * Onboarding + groups smoke tests.
 *
 * These tests assume Plan 1's auth is working and that the user has
 * SIGNED IN MANUALLY at least once in the test browser (Playwright will
 * use localStorage tokens from that session). For a fully automated CI
 * setup, we'd add a global-setup that signs in once and persists state.
 *
 * Skip via SKIP_AUTH_TESTS=1 if you want to run only Plan 1's tests.
 */

test.describe("groups smoke flow", () => {
  test.skip(
    !!process.env.SKIP_AUTH_TESTS,
    "Set SKIP_AUTH_TESTS=1 to skip these tests in CI without auth setup.",
  );

  test("groups page renders (when authed)", async ({ page }) => {
    await page.goto("/groups");

    // Either signed-in (groups page renders) OR redirected to sign-in.
    // We only assert the rendering case; if redirected, the test is N/A.
    await page.waitForLoadState("networkidle");
    if (page.url().includes("/sign-in")) {
      test.skip(true, "Need a signed-in browser. Sign in manually first.");
    }

    await expect(page.getByRole("heading", { name: /groups/i })).toBeVisible();
  });

  test("create group form validates required name", async ({ page }) => {
    await page.goto("/groups/new");
    await page.waitForLoadState("networkidle");
    if (page.url().includes("/sign-in") || page.url().includes("/welcome")) {
      test.skip(true, "Sign in + complete onboarding before running this test.");
    }

    await page
      .getByRole("button", { name: /^create group$/i })
      .click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /give your group a name/i }),
    ).toBeVisible();
  });

  test("create group → appears in list → settings → delete", async ({
    page,
  }) => {
    const groupName = `Test ${Date.now()}`;
    await page.goto("/groups/new");
    await page.waitForLoadState("networkidle");
    if (page.url().includes("/sign-in") || page.url().includes("/welcome")) {
      test.skip(true, "Sign in + complete onboarding before running this test.");
    }

    await page.getByLabel(/name/i).fill(groupName);
    await page.getByRole("button", { name: /^create group$/i }).click();

    // Redirect to /groups/<id>
    await page.waitForURL(/\/groups\/[a-z0-9]+$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: groupName })).toBeVisible();

    // Navigate back to list, see the group.
    await page.goto("/groups");
    await expect(page.getByText(groupName).first()).toBeVisible();

    // Open settings, delete.
    await page.getByText(groupName).first().click();
    await page.getByRole("link", { name: /group settings/i }).click();

    // Confirm dialog accept (Playwright auto-accepts by default with a handler).
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: /delete this group/i })
      .click();

    // Should return to /groups, group gone from list.
    await page.waitForURL(/\/groups\/?$/, { timeout: 10_000 });
    await expect(page.getByText(groupName)).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run only Plan 1 tests to confirm no regressions**

```bash
SKIP_AUTH_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test tests/e2e/auth.spec.ts --reporter=list 2>&1 | tail -5
```
Expected: 6 passes.

- [ ] **Step 3: Run groups tests (will likely skip if not signed in)**

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test tests/e2e/groups.spec.ts --reporter=list 2>&1 | tail -10
```
Expected: tests either pass (if you've stored auth) or skip with helpful message. To run them fully, set up Playwright global-setup for signed-in storageState (Plan 10 task).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/groups.spec.ts
git commit -m "test: e2e tests for groups create/list/settings/delete (skip-when-unauthed)"
```

---

## Task 22: README + manual self-verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update plan roadmap**

In `README.md`, find the "Implementation plans" section and change Plan 2's status to ✅:

```markdown
1. ✅ Foundation & Auth ([plans/01-foundation-auth.md](./plans/01-foundation-auth.md))
2. ✅ Onboarding & Groups ([plans/02-onboarding-groups.md](./plans/02-onboarding-groups.md)) — current
3. ⬜ Invites & QR Sharing
```

Also add to the "Common issues" table:

```markdown
| Onboarding redirect loop | `decssy_onboarded` cookie not set after completion | Manually set `document.cookie = "decssy_onboarded=1; path=/"` in DevTools console, refresh |
```

- [ ] **Step 2: Manual verification checklist**

Run through each in a fresh incognito window:

- [ ] Sign up a brand-new test account (password method) → expect redirect to /welcome
- [ ] /welcome shows welcome screen with step 0 indicator
- [ ] Click "Get started" → /welcome/profile with step 1 indicator, name pre-filled if Google
- [ ] Submit name + timezone → /welcome/start with step 2 indicator
- [ ] Click "Create a group" → /groups/new
- [ ] Fill name "Family" + pick emerald → Create → /groups/<id> shows hero with 1 member (you, owner)
- [ ] Click back → /groups shows the group
- [ ] Click the group → /groups/<id>
- [ ] Click settings cog → edit name + color → Save → see "Saved." → back, hero updated
- [ ] On settings, click "Delete this group" → confirm → /groups (empty again)
- [ ] Sign out → sign back in → expect to land on /calendar (not /welcome — onboardedAt persists)

- [ ] **Step 3: Run all tests**

```bash
npm test 2>&1 | tail -5
SKIP_AUTH_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test --reporter=list 2>&1 | tail -10
```
Expected: Vitest passes (ColorPicker 3/3), Playwright passes (auth 6/6).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: mark Plan 2 complete in README roadmap"
```

---

## Self-Review (writer's pass)

### Spec coverage

Mapping PRD requirements → Plan 2 tasks:

| PRD requirement | Task in Plan 2 |
|---|---|
| 5.1 Onboarding (3-step) | Tasks 13–15 |
| 5.2 Group create + name/description/color | Tasks 7, 17 |
| 5.2 Group list | Task 18 |
| 5.2 Group detail with members | Task 19 |
| 5.2 Edit settings (owner) | Task 20 |
| 5.2 Leave group (non-owner) | Task 10, 20 |
| 5.2 Delete group (owner) | Task 10, 20 |
| 7.2 groups table | (defined in Plan 1) |
| 7.3 groupMembers table | (defined in Plan 1) |
| 16.5 design tokens | Already applied throughout |

**Out of scope for Plan 2 (correctly deferred):**
- Invite tokens + QR + join flow → Plan 3
- Ownership transfer → Plan 3 (needs >1 member)
- Group history/audit log → Plan 3 (logs invite-related events too)
- Group color palette runtime editing → Phase 2 (PRD §19.2 #6)

### Placeholder scan

No "TBD", no "TODO", no "implement later" — every code block is concrete and runnable. Error copy is specific (e.g., "Owners can't leave — delete the group or transfer ownership first").

### Type consistency

- `GroupColor` from `convex/lib/groupColors.ts` is used both by client (ColorPicker, GroupCreateForm) and server (validation in createGroup/updateGroup).
- `Doc<"groups">` and `Id<"groups">` shapes flow from Convex's generated types — no manual type duplication.
- `getGroup` returns `{ group, members, isOwner }` — used identically by detail and settings pages.
- `requireMember` and `requireOwner` return `Id<"users">` consistently for caller use.

### Risks called out

1. **Onboarding-redirect cookie race** — middleware checks `decssy_onboarded` cookie, set on completion. If user closes browser between step 1 and 2, they'd be onboarded (timestamp set) but the cookie wouldn't be on the new browser; they'd loop through /welcome again. Mitigation: in Task 4's middleware, we could ALSO check via a server-side query, but that adds DB roundtrips on every request. Plan 10 (Polish) is a fine time to address if real users hit it.

2. **Cascading delete depth** — `deleteGroup` currently nukes `groupMembers` only because that's all the schema has now. Plan 4 (events), Plan 6 (comments), Plan 3 (invites) all add tables that need to cascade. Each plan adding a table should also extend `deleteGroup`. I'll add a reminder to those plans.

3. **`isValidGroupColor` runs at the type level too** — if we tightened `groups.color` to `v.union(v.literal("#10B981"), ...)`, server-side validation wouldn't need this helper. Keeping it as `v.string()` is more flexible (e.g., Plan 4 user-custom-color feature), at the cost of validation needing the helper. Trade-off accepted.

4. **Pre-existing users (before Plan 2 deploy) won't have `onboardedAt`** — their middleware will redirect them to /welcome. Not destructive — they just re-complete onboarding (with current name + tz pre-filled). For the freelance project's single test user (you), this is fine. Production deploys later would warrant a backfill migration.

---

**Plan complete.** Saved to `plans/02-onboarding-groups.md`.

When ready to execute, the next skill is `superpowers:executing-plans` (inline) or `superpowers:subagent-driven-development` (recommended now that auth setup is no longer in the critical path — most of Plan 2 is pure code).

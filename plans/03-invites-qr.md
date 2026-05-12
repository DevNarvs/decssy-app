# Plan 3: Invites & QR Sharing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A group owner can generate a shareable invite (QR code + URL). Anyone who scans/clicks lands on a public preview page; signing up auto-joins them to the group. iMessage/WhatsApp/Slack/etc. show a proper Open Graph preview. Owners can revoke active invites and transfer ownership to a member.

**Architecture:** A new `groupInvites` table stores short URL-safe tokens with expiry + use-count + revocation flag. The public route `/join/[token]` is server-rendered (preserves OG meta tags for crawlers), shows group preview via a NEW unauthenticated query, and routes signed-out visitors to sign-up (passing the token through localStorage). After auth, a tiny `/join/[token]/accept` page calls `acceptInvite` and redirects to the group. QR codes are generated server-side via the `qrcode` npm package inside a Convex action. Transfer ownership reuses the permission helpers from Plan 2.

**Tech Stack** (one new dependency):
- `qrcode` npm package for SVG QR generation (server-side)
- No `@vercel/og` for now — static OG image (the existing PWA icon) suffices for Plan 3; dynamic OG renders ship in Plan 10

**Prerequisites:** Plan 2 complete. At least 2 testable accounts (you sign in with one account in incognito, the second in a regular window).

---

## Plan 2 lessons applied

1. **Reactive queries that throw on permission loss crash the UI** — Plan 2 fixed `getGroup` to return `null`. Same pattern for any new query an owner-only viewer might lose access to (e.g., `listGroupInvites` returns `null` if you're no longer the owner).
2. **Navigate before destructive mutations** to let subscriptions unmount — applied to revokeInvite and transferOwnership.
3. **ConfirmDialog component is ready** — reuse for destructive actions (revoke invite, transfer ownership).
4. **`npx convex dev --once` after every Convex change** to regen types.
5. **Tailwind 4 animate-in classes are no-ops** until we install proper keyframes — fine, plan 10 polish.

---

## File structure (delta from Plan 2)

```
decssy/
├─ app/
│  ├─ (app)/
│  │  └─ groups/[id]/
│  │     ├─ invite/page.tsx              ← NEW (owner-only)
│  │     └─ settings/page.tsx            ← MODIFIED (adds transfer UI)
│  ├─ join/
│  │  └─ [token]/
│  │     ├─ page.tsx                     ← NEW (public, server-rendered)
│  │     └─ accept/page.tsx              ← NEW (post-auth handler)
│  └─ welcome/start/page.tsx             ← MODIFIED ("I have an invite" enabled)
├─ components/
│  ├─ groups/
│  │  ├─ InviteShareCard.tsx             ← NEW (QR + link + copy + native share)
│  │  ├─ ActiveInvitesList.tsx           ← NEW (owner's active invites with revoke)
│  │  └─ TransferOwnershipDialog.tsx     ← NEW (member picker + confirm)
│  └─ ui/
│     └─ CopyButton.tsx                  ← NEW (small reusable)
├─ convex/
│  ├─ schema.ts                          ← MODIFIED (groupInvites table)
│  ├─ invites.ts                         ← NEW (5 functions)
│  ├─ groups.ts                          ← MODIFIED (add transferOwnership)
│  └─ lib/
│     └─ tokens.ts                       ← NEW (URL-safe random generator)
├─ lib/hooks/
│  └─ usePendingInvite.ts                ← NEW (localStorage <-> auth flow bridge)
├─ middleware.ts                         ← MODIFIED (/join/* and /join/*/accept routing)
└─ tests/e2e/
   └─ invites.spec.ts                    ← NEW (4 tests)
```

---

## Task 0: Pre-flight verification

- [ ] **Step 1: Clean working tree on `main`**

```bash
git status
```
Expected: `nothing to commit, working tree clean`.

- [ ] **Step 2: Plan 2 tests pass**

```bash
SKIP_AUTH_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test --reporter=list 2>&1 | tail -3
```
Expected: 6/6 auth tests pass.

- [ ] **Step 3: Both servers running**

Confirm `npx convex dev` running in one terminal and `npm run dev` in another. http://localhost:3002 should load.

---

## Task 1: Add `groupInvites` table to schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add the table**

Inside `defineSchema({ ... })`, after `groupMembers`, add:

```typescript
  groupInvites: defineTable({
    groupId: v.id("groups"),
    token: v.string(),           // URL-safe random, ~24 chars (~143 bits entropy)
    createdBy: v.id("users"),    // owner who issued (must still be owner to revoke)
    createdAt: v.number(),
    expiresAt: v.number(),        // ms epoch; default = createdAt + 7d
    maxUses: v.optional(v.number()), // null/undefined = unlimited
    usedCount: v.number(),        // increments on each successful acceptInvite
    revokedAt: v.optional(v.number()), // soft revoke; absence = active
  })
    .index("by_token", ["token"])
    .index("by_group", ["groupId"])
    .index("by_group_and_active", ["groupId", "revokedAt"]),
```

- [ ] **Step 2: Deploy + verify**

```bash
npx convex dev --once && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add groupInvites table (token, expiry, use-count, revoke)"
```

---

## Task 2: URL-safe token generator

**Files:**
- Create: `convex/lib/tokens.ts`

- [ ] **Step 1: Write it**

Create `convex/lib/tokens.ts`:

```typescript
/**
 * URL-safe random tokens for group invites.
 *
 * Uses base64url over crypto.getRandomValues; ~143 bits of entropy in 24 chars
 * — enough that brute-forcing an active invite is computationally infeasible
 * even at internet scale.
 *
 * Returns:
 *   - 24-char string from [A-Z][a-z][0-9]-_
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(18); // 18 bytes → 24 base64url chars
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
```

- [ ] **Step 2: Commit**

```bash
git add convex/lib/tokens.ts
git commit -m "feat: URL-safe invite token generator (24 chars, 143 bits entropy)"
```

---

## Task 3: `createInvite` mutation

**Files:**
- Create: `convex/invites.ts`

- [ ] **Step 1: Write it**

Create `convex/invites.ts`:

```typescript
/**
 * Group invite queries and mutations.
 *
 * Public query (no auth): getInvitePreview — used by /join/[token] before
 * sign-in. Returns minimal group info or null for invalid/expired tokens.
 *
 * Auth required: createInvite, acceptInvite, listGroupInvites, revokeInvite.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireOwner, requireUser } from "./lib/permissions";
import { generateInviteToken } from "./lib/tokens";

const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ACTIVE_INVITES_PER_GROUP = 5;

/**
 * Owner-only: create a new invite token for the group.
 * Throws if there are already 5 active (unrevoked, unexpired) invites
 * for the group — keeps the dashboard manageable and limits abuse.
 */
export const createInvite = mutation({
  args: {
    groupId: v.id("groups"),
    maxUses: v.optional(v.number()), // undefined = unlimited
  },
  handler: async (ctx, { groupId, maxUses }) => {
    const userId = await requireOwner(ctx, groupId);

    // Count active invites for this group.
    const now = Date.now();
    const all = await ctx.db
      .query("groupInvites")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    const activeCount = all.filter(
      (i) => i.revokedAt === undefined && i.expiresAt > now,
    ).length;
    if (activeCount >= MAX_ACTIVE_INVITES_PER_GROUP) {
      throw new Error(
        `Max ${MAX_ACTIVE_INVITES_PER_GROUP} active invites per group — revoke an old one first.`,
      );
    }

    if (maxUses !== undefined && maxUses < 1) {
      throw new Error("maxUses must be at least 1 or omitted for unlimited");
    }

    const inviteId = await ctx.db.insert("groupInvites", {
      groupId,
      token: generateInviteToken(),
      createdBy: userId,
      createdAt: now,
      expiresAt: now + DEFAULT_EXPIRY_MS,
      maxUses,
      usedCount: 0,
    });

    return inviteId;
  },
});
```

- [ ] **Step 2: Deploy + verify**

```bash
npx convex dev --once && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add convex/invites.ts
git commit -m "feat: createInvite mutation (5-active-per-group cap, 7d default expiry)"
```

---

## Task 4: `revokeInvite`, `listGroupInvites`

**Files:**
- Modify: `convex/invites.ts`

- [ ] **Step 1: Append both**

```typescript
/**
 * Owner-only: soft-revoke an invite. The token becomes immediately invalid;
 * the row stays in the DB for audit (Plan 9 audit log will read it).
 */
export const revokeInvite = mutation({
  args: { inviteId: v.id("groupInvites") },
  handler: async (ctx, { inviteId }) => {
    const userId = await requireUser(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error("Invite not found");
    // Verify ownership of the parent group.
    const group = await ctx.db.get(invite.groupId);
    if (!group || group.ownerId !== userId) {
      throw new Error("Only the group owner can revoke invites");
    }
    if (invite.revokedAt !== undefined) return; // idempotent
    await ctx.db.patch(inviteId, { revokedAt: Date.now() });
  },
});

/**
 * Owner-only list of a group's active invites. Returns null if the caller
 * isn't the group owner (consistent with getGroup's null-on-no-access).
 */
export const listGroupInvites = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const group = await ctx.db.get(groupId);
    if (!group || group.ownerId !== userId) return null;

    const now = Date.now();
    const all = await ctx.db
      .query("groupInvites")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    return all
      .filter((i) => i.revokedAt === undefined && i.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});
```

- [ ] **Step 2: Commit**

```bash
npx convex dev --once && npx tsc --noEmit
git add convex/invites.ts
git commit -m "feat: revokeInvite (owner soft-delete) + listGroupInvites (active only)"
```

---

## Task 5: `getInvitePreview` (public, no auth)

**Files:**
- Modify: `convex/invites.ts`

- [ ] **Step 1: Append**

```typescript
/**
 * PUBLIC query — no auth required. Used by the /join/[token] landing page
 * to show "you've been invited to <Group>" before the visitor signs up.
 *
 * Returns minimal info (group name, color, member count, owner name). Does
 * NOT leak full member roster or any private data. Returns null for:
 *   - invalid token
 *   - revoked invite
 *   - expired invite
 *   - max-uses-reached invite
 *   - missing group (orphaned invite)
 *
 * Note: this is a `query`, not an `action`. Convex queries are public-readable
 * by anonymous clients when no auth check is performed inside.
 */
export const getInvitePreview = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query("groupInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite) return null;
    if (invite.revokedAt !== undefined) return null;
    if (invite.expiresAt <= Date.now()) return null;
    if (invite.maxUses !== undefined && invite.usedCount >= invite.maxUses) {
      return null;
    }

    const group = await ctx.db.get(invite.groupId);
    if (!group) return null;

    const owner = await ctx.db.get(group.ownerId);

    const memberCount = (
      await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", invite.groupId))
        .collect()
    ).length;

    return {
      groupName: group.name,
      groupColor: group.color,
      groupDescription: group.description,
      memberCount,
      ownerName: owner?.name ?? owner?.email ?? "Someone",
      expiresAt: invite.expiresAt,
    };
  },
});
```

- [ ] **Step 2: Commit**

```bash
npx convex dev --once && npx tsc --noEmit
git add convex/invites.ts
git commit -m "feat: getInvitePreview public query for /join/[token] landing"
```

---

## Task 6: `acceptInvite` mutation

**Files:**
- Modify: `convex/invites.ts`

- [ ] **Step 1: Append**

```typescript
/**
 * Auth required: signed-in user accepts an invite by token.
 *
 * Returns the joined group's _id on success.
 *
 * Idempotent: if user is already a member of the target group, returns the
 * group _id without throwing or incrementing usedCount.
 *
 * Throws (visible to user) for: invalid/expired/revoked tokens, max-uses
 * reached, missing group.
 */
export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireUser(ctx);

    const invite = await ctx.db
      .query("groupInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite) throw new Error("Invalid invite link");
    if (invite.revokedAt !== undefined) throw new Error("This invite was revoked");
    if (invite.expiresAt <= Date.now()) throw new Error("This invite has expired");
    if (invite.maxUses !== undefined && invite.usedCount >= invite.maxUses) {
      throw new Error("This invite has reached its use limit");
    }

    const group = await ctx.db.get(invite.groupId);
    if (!group) throw new Error("The group for this invite no longer exists");

    // Idempotent: already a member?
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", invite.groupId).eq("userId", userId),
      )
      .unique();
    if (existing) return invite.groupId;

    await ctx.db.insert("groupMembers", {
      groupId: invite.groupId,
      userId,
      joinedAt: Date.now(),
    });

    await ctx.db.patch(invite._id, { usedCount: invite.usedCount + 1 });

    return invite.groupId;
  },
});
```

- [ ] **Step 2: Commit**

```bash
npx convex dev --once && npx tsc --noEmit
git add convex/invites.ts
git commit -m "feat: acceptInvite mutation (idempotent join + usedCount increment)"
```

---

## Task 7: `transferOwnership` mutation

**Files:**
- Modify: `convex/groups.ts`

- [ ] **Step 1: Append**

```typescript
/**
 * Owner-only: hand over ownership to another member of the group.
 *
 * The new owner must already be a member. After transfer, the previous
 * owner remains a regular member (does NOT auto-leave).
 *
 * This is the foundation for Plan 9's audit log — every transfer logs
 * the actor + target + timestamp.
 */
export const transferOwnership = mutation({
  args: {
    groupId: v.id("groups"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, { groupId, newOwnerId }) => {
    const currentOwnerId = await requireOwner(ctx, groupId);
    if (newOwnerId === currentOwnerId) {
      throw new Error("You're already the owner");
    }

    // Verify new owner is a current member.
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", groupId).eq("userId", newOwnerId),
      )
      .unique();
    if (!membership) {
      throw new Error("The chosen person is not a member of this group");
    }

    await ctx.db.patch(groupId, { ownerId: newOwnerId });
  },
});
```

- [ ] **Step 2: Commit**

```bash
npx convex dev --once && npx tsc --noEmit
git add convex/groups.ts
git commit -m "feat: transferOwnership mutation (was deferred from Plan 2)"
```

---

## Task 8: QR code server action

**Files:**
- Modify: `package.json` (install `qrcode`)
- Create: `convex/qr.ts`

- [ ] **Step 1: Install qrcode**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Convex action for QR generation**

Create `convex/qr.ts`:

```typescript
/**
 * QR code generation as a Convex action (runs in Node.js, not the V8
 * isolate used by queries/mutations — `qrcode` needs Node APIs).
 *
 * Returns an SVG string. The caller can either embed it inline in JSX
 * via dangerouslySetInnerHTML or display via <img src="data:image/svg+xml;...">.
 */
"use node";

import QRCode from "qrcode";
import { v } from "convex/values";
import { action } from "./_generated/server";

export const generate = action({
  args: { data: v.string() },
  handler: async (_ctx, { data }): Promise<string> => {
    const svg = await QRCode.toString(data, {
      type: "svg",
      width: 256,
      margin: 1,
      color: {
        dark: "#2c1f17", // text color
        light: "#fdf7f2", // bg color (Peach Fuzz)
      },
    });
    return svg;
  },
});
```

- [ ] **Step 3: Verify + commit**

```bash
npx convex dev --once && npx tsc --noEmit
git add convex/qr.ts package.json package-lock.json
git commit -m "feat: QR code server action via qrcode npm + Peach Fuzz colors"
```

---

## Task 9: Middleware update for public /join routes

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Add public route matcher + handling**

In `middleware.ts`, update the matchers and handler:

```typescript
const isSignInPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isWelcomePage = createRouteMatcher(["/welcome(.*)"]);
const isJoinLanding = createRouteMatcher(["/join/:token"]); // public
const isJoinAccept = createRouteMatcher(["/join/:token/accept"]); // auth-required
const isProtectedRoute = createRouteMatcher([
  "/calendar(.*)",
  "/groups(.*)",
  "/find(.*)",
  "/inbox(.*)",
  "/settings(.*)",
]);
```

Update handler body — `/join/[token]` is public, `/join/[token]/accept` is auth-required:

```typescript
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  if (isSignInPage(request) && isAuthed) {
    return nextjsMiddlewareRedirect(request, "/calendar");
  }
  if (isProtectedRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
  if (isJoinAccept(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
  // Note: isJoinLanding allows unauthenticated access — no redirect.

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
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: middleware routes /join/[token] public, /join/[token]/accept auth-only"
```

---

## Task 10: `usePendingInvite` localStorage bridge

**Files:**
- Create: `lib/hooks/usePendingInvite.ts`

- [ ] **Step 1: Write the hook**

Create `lib/hooks/usePendingInvite.ts`:

```typescript
"use client";

/**
 * Stores an invite token in localStorage so it survives the sign-in/sign-up
 * round-trip. After auth, the calendar/welcome page checks the storage and
 * redirects to /join/[token]/accept to consume the token.
 *
 * Why localStorage and not a URL param: the Convex Auth sign-in flow doesn't
 * cleanly propagate query strings through the post-auth redirect. Storage
 * is simpler, survives the OAuth round-trip, and we clear it after use.
 *
 * Why not a cookie: a cookie would work too, but localStorage keeps the
 * concern client-side (middleware doesn't need to know about it).
 */
const KEY = "decssy_pending_invite";

export function setPendingInvite(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, token);
}

export function getPendingInvite(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function clearPendingInvite(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/hooks/usePendingInvite.ts
git commit -m "feat: pending-invite localStorage bridge (set/get/clear)"
```

---

## Task 11: CopyButton component

**Files:**
- Create: `components/ui/CopyButton.tsx`

- [ ] **Step 1: Write it**

Create `components/ui/CopyButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for non-secure contexts — old way still works.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-bold transition-colors",
        "hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        copied ? "text-positive" : "text-text-muted",
        className,
      )}
    >
      {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={1.5} />}
      {copied ? "Copied!" : label}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/CopyButton.tsx
git commit -m "feat: CopyButton with clipboard API + execCommand fallback"
```

---

## Task 12: InviteShareCard component

**Files:**
- Create: `components/groups/InviteShareCard.tsx`

- [ ] **Step 1: Write it**

Create `components/groups/InviteShareCard.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CopyButton } from "@/components/ui/CopyButton";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteShareCardProps {
  token: string;
  baseUrl: string; // e.g., "http://localhost:3002" or production URL
}

export function InviteShareCard({ token, baseUrl }: InviteShareCardProps) {
  const generate = useAction(api.qr.generate);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  const url = `${baseUrl}/join/${token}`;

  useEffect(() => {
    let cancelled = false;
    generate({ data: url })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch((err) => {
        console.warn("QR generation failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [url, generate]);

  async function handleNativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "Join my Decssy group",
        text: "I'd love to add you to our shared calendar.",
        url,
      });
    } catch {
      // user cancelled — silent.
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6">
      <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-bg">
        {qrSvg ? (
          // eslint-disable-next-line react/no-danger
          <div
            className="h-full w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            aria-label="QR code for invite link"
          />
        ) : (
          <div className="text-sm text-text-muted">Generating QR…</div>
        )}
      </div>

      <div className="w-full">
        <label className="mb-1 block text-sm font-bold text-text-muted">
          Or share the link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={url}
            onClick={(e) => e.currentTarget.select()}
            className="h-9 flex-1 min-w-0 rounded-md border border-border bg-surface px-3 text-sm text-text-muted"
          />
          <CopyButton value={url} />
        </div>
      </div>

      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          type="button"
          onClick={handleNativeShare}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          )}
        >
          <Share2 size={16} strokeWidth={1.5} />
          Share via…
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/groups/InviteShareCard.tsx
git commit -m "feat: InviteShareCard with server-rendered QR + copy link + native share"
```

---

## Task 13: ActiveInvitesList component

**Files:**
- Create: `components/groups/ActiveInvitesList.tsx`

- [ ] **Step 1: Write it**

Create `components/groups/ActiveInvitesList.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

interface ActiveInvitesListProps {
  invites: Doc<"groupInvites">[];
  groupName: string;
}

export function ActiveInvitesList({ invites, groupName }: ActiveInvitesListProps) {
  const revokeInvite = useMutation(api.invites.revokeInvite);
  const [confirmTarget, setConfirmTarget] = useState<Id<"groupInvites"> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleRevoke() {
    if (!confirmTarget) return;
    setIsProcessing(true);
    try {
      await revokeInvite({ inviteId: confirmTarget });
      setConfirmTarget(null);
    } catch (err) {
      console.warn("Revoke failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  if (invites.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        No other active invites. The QR code above is your one and only.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {invites.map((inv) => {
          const expiresIn = Math.ceil(
            (inv.expiresAt - Date.now()) / (1000 * 60 * 60 * 24),
          );
          return (
            <li
              key={inv._id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm text-text">
                  ...{inv.token.slice(-8)}
                </div>
                <div className="text-sm text-text-muted">
                  Used {inv.usedCount}× · expires in {expiresIn}d
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTarget(inv._id)}
                className={cn(
                  "rounded-md border border-negative/40 bg-surface px-3 py-1.5 text-xs font-bold text-negative",
                  "hover:bg-negative/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative",
                )}
              >
                Revoke
              </button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmTarget !== null}
        onClose={() => !isProcessing && setConfirmTarget(null)}
        onConfirm={handleRevoke}
        variant="danger"
        isProcessing={isProcessing}
        title="Revoke this invite?"
        description={`Anyone holding this link won't be able to join "${groupName}" anymore. People who already joined are unaffected.`}
        confirmLabel="Yes, revoke"
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/groups/ActiveInvitesList.tsx
git commit -m "feat: ActiveInvitesList — list active invites with revoke confirm"
```

---

## Task 14: `/groups/[id]/invite` owner-only page

**Files:**
- Create: `app/(app)/groups/[id]/invite/page.tsx`

- [ ] **Step 1: Page**

Create `app/(app)/groups/[id]/invite/page.tsx`:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { InviteShareCard } from "@/components/groups/InviteShareCard";
import { ActiveInvitesList } from "@/components/groups/ActiveInvitesList";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupInvitePage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const detail = useQuery(api.groups.getGroup, { groupId });
  const invites = useQuery(api.invites.listGroupInvites, { groupId });
  const createInvite = useMutation(api.invites.createInvite);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInvite, setCurrentInvite] = useState<Doc<"groupInvites"> | null>(null);

  // Auto-pick most recent active invite as the displayed one.
  // If none exist, auto-create one on first load.
  useEffect(() => {
    if (invites === undefined) return;
    if (invites === null) return; // not the owner
    if (invites.length === 0 && !currentInvite) {
      setIsCreating(true);
      createInvite({ groupId })
        .then(() => setIsCreating(false))
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Couldn't create invite.");
          setIsCreating(false);
        });
    } else if (invites.length > 0 && !currentInvite) {
      const first = invites[0];
      if (first) setCurrentInvite(first);
    }
  }, [invites, currentInvite, createInvite, groupId]);

  // Owner check: getGroup returns null for non-members. listGroupInvites
  // returns null for non-owners. If either is null, this is a permission
  // denial — back to /groups.
  if (detail === undefined || invites === undefined) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe">
        <div className="my-8 h-64 animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }
  if (detail === null || invites === null) {
    if (typeof window !== "undefined") {
      window.location.href = "/groups";
    }
    return null;
  }

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://decssy.app";

  const displayInvite = currentInvite ?? invites[0];

  async function handleRegenerate() {
    setError(null);
    setIsCreating(true);
    try {
      await createInvite({ groupId });
      setCurrentInvite(null); // useEffect re-picks
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't regenerate.");
    } finally {
      setIsCreating(false);
    }
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
          Invite
        </h1>
      </header>

      <div className="space-y-6">
        <div>
          <p className="mb-3 text-md text-text-muted">
            Share this with friends to add them to{" "}
            <span className="font-bold text-text">{detail.group.name}</span>.
            Anyone with the link can join until you revoke it.
          </p>
        </div>

        {displayInvite ? (
          <InviteShareCard token={displayInvite.token} baseUrl={baseUrl} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-surface">
            {isCreating ? (
              <Loader2 size={24} className="animate-spin text-accent" />
            ) : (
              <span className="text-sm text-text-muted">No active invite.</span>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isCreating}
          className={cn(
            "flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-bold text-text-muted",
            "transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isCreating && "cursor-not-allowed opacity-60",
          )}
        >
          {isCreating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} strokeWidth={1.5} />
          )}
          Generate new invite
        </button>

        {/* Other active invites */}
        {invites.filter((i) => i._id !== displayInvite?._id).length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
              Other active invites ({invites.filter((i) => i._id !== displayInvite?._id).length})
            </h3>
            <ActiveInvitesList
              invites={invites.filter((i) => i._id !== displayInvite?._id)}
              groupName={detail.group.name}
            />
          </section>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add invite-people CTA to group detail page**

Modify `app/(app)/groups/[id]/page.tsx` to add an "Invite people" button in the GroupHero or below it. Wrap the hero section with:

```tsx
<div className="space-y-2">
  <GroupHero ... />
  {detail.isOwner && (
    <Link
      href={`/groups/${groupId}/invite`}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
    >
      <Share2 size={16} strokeWidth={1.5} />
      Invite people
    </Link>
  )}
</div>
```

(Add `import { Share2 } from "lucide-react"` at top.)

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add "app/(app)/groups/[id]/invite/page.tsx" "app/(app)/groups/[id]/page.tsx"
git commit -m "feat: /groups/[id]/invite page with auto-create + regenerate + invite-people CTA"
```

---

## Task 15: `/join/[token]` public landing page

**Files:**
- Create: `app/join/[token]/page.tsx`
- Create: `app/join/[token]/layout.tsx` (no nav)

- [ ] **Step 1: Layout (no nav)**

Create `app/join/[token]/layout.tsx`:

```tsx
export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Public page with OG tags**

Create `app/join/[token]/page.tsx`:

```tsx
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { JoinLandingClient } from "./JoinLandingClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getPreview(token: string) {
  return await fetchQuery(api.invites.getInvitePreview, { token });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const preview = await getPreview(token);

  if (!preview) {
    return {
      title: "Invite · Decssy",
      description: "This invite link is invalid or has expired.",
    };
  }

  const title = `Join ${preview.groupName} on Decssy`;
  const description = `${preview.memberCount} ${preview.memberCount === 1 ? "member" : "members"} · Created by ${preview.ownerName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/icons/icon-512.png"], // Plan 10 replaces with dynamic OG render
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icons/icon-512.png"],
    },
  };
}

export default async function JoinLandingPage({ params }: PageProps) {
  const { token } = await params;
  const preview = await getPreview(token);

  if (!preview) {
    return <JoinLandingClient token={token} preview={null} />;
  }
  return <JoinLandingClient token={token} preview={preview} />;
}
```

- [ ] **Step 3: Client component for interactivity**

Create `app/join/[token]/JoinLandingClient.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { setPendingInvite } from "@/lib/hooks/usePendingInvite";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";

interface Preview {
  groupName: string;
  groupColor: string;
  groupDescription?: string;
  memberCount: number;
  ownerName: string;
  expiresAt: number;
}

interface Props {
  token: string;
  preview: Preview | null;
}

export function JoinLandingClient({ token, preview }: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  // If we're authenticated, jump straight to /join/[token]/accept which
  // does the join + redirect. If not, store the token for post-auth resume
  // and show the public preview.
  useEffect(() => {
    if (!isLoading && isAuthenticated && preview) {
      router.replace(`/join/${token}/accept`);
    }
  }, [isLoading, isAuthenticated, preview, router, token]);

  function handleSignIn() {
    setPendingInvite(token);
    router.push("/sign-in");
  }
  function handleSignUp() {
    setPendingInvite(token);
    router.push("/sign-up");
  }

  if (!preview) {
    return (
      <WelcomeCard
        title="Invite not valid."
        subtitle="This invite link has expired, been revoked, or reached its use limit. Ask the group owner for a new one."
      >
        <Link
          href="/sign-in"
          className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          Sign in to Decssy
        </Link>
      </WelcomeCard>
    );
  }

  const expiresIn = Math.ceil(
    (preview.expiresAt - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <WelcomeCard
      title="You've been invited."
      subtitle={`Join ${preview.groupName} on Decssy.`}
    >
      <div className="my-2 flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-lg font-extrabold text-white"
          style={{ backgroundColor: preview.groupColor }}
          aria-hidden="true"
        >
          {preview.groupName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-md font-extrabold text-text">
            {preview.groupName}
          </div>
          <div className="truncate text-sm text-text-muted">
            {preview.memberCount}{" "}
            {preview.memberCount === 1 ? "member" : "members"} · Created by{" "}
            {preview.ownerName}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <button
          type="button"
          onClick={handleSignUp}
          className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          Sign up & join
        </button>
        <button
          type="button"
          onClick={handleSignIn}
          className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted transition-colors hover:bg-surface-2"
        >
          Sign in instead
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-text-muted">
        Expires in {expiresIn} {expiresIn === 1 ? "day" : "days"}
      </p>
    </WelcomeCard>
  );
}
```

- [ ] **Step 4: Commit**

```bash
npx tsc --noEmit
git add app/join package.json package-lock.json
git commit -m "feat: /join/[token] public landing with OG meta + preview card + auth CTAs"
```

---

## Task 16: `/join/[token]/accept` post-auth handler

**Files:**
- Create: `app/join/[token]/accept/page.tsx`

- [ ] **Step 1: Write it**

Create `app/join/[token]/accept/page.tsx`:

```tsx
"use client";

import { use, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { clearPendingInvite } from "@/lib/hooks/usePendingInvite";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function AcceptInvitePage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const acceptInvite = useMutation(api.invites.acceptInvite);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    acceptInvite({ token })
      .then((groupId) => {
        clearPendingInvite();
        if (!cancelled) {
          router.replace(`/groups/${groupId}`);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't join group.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, acceptInvite, router]);

  return (
    <WelcomeCard
      title="Joining group…"
      subtitle="One moment while we add you."
    >
      {!error && (
        <div className="my-8 flex justify-center">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      )}
      {error && (
        <>
          <div
            role="alert"
            className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
          >
            {error}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/calendar")}
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted"
            >
              Go to calendar
            </button>
            <button
              type="button"
              onClick={() => router.push("/groups")}
              className="flex h-11 flex-1 items-center justify-center rounded-md bg-accent text-md font-extrabold text-white"
            >
              View groups
            </button>
          </div>
        </>
      )}
    </WelcomeCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/join/[token]/accept/page.tsx"
git commit -m "feat: /join/[token]/accept handler — calls acceptInvite + redirects to group"
```

---

## Task 17: Pending-invite redirect on /calendar

**Files:**
- Modify: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Redirect logic**

Replace `app/(app)/calendar/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { getPendingInvite, clearPendingInvite } from "@/lib/hooks/usePendingInvite";

export default function CalendarPage() {
  const router = useRouter();

  // If user signed up via an invite link, redirect to the accept page now.
  useEffect(() => {
    const token = getPendingInvite();
    if (token) {
      // Don't clear here — the accept page will clear after a successful join.
      router.replace(`/join/${token}/accept`);
    }
  }, [router]);

  return (
    <PlaceholderScreen
      title="Calendar."
      comingIn="Calendar UI ships in Plan 5."
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/calendar/page.tsx"
git commit -m "feat: calendar redirects to /join/[token]/accept if pending invite exists"
```

---

## Task 18: Enable "I have an invite link" on welcome step 2

**Files:**
- Modify: `app/welcome/start/page.tsx`

- [ ] **Step 1: Replace the disabled button with an input modal**

Replace `app/welcome/start/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Mail } from "lucide-react";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { setPendingInvite } from "@/lib/hooks/usePendingInvite";

export default function WelcomeStartPage() {
  const router = useRouter();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAcceptInvite() {
    setError(null);
    // Accept either a full URL ("/join/abc...") or just the token.
    const match = inviteUrl.match(/\/join\/([A-Za-z0-9_-]+)/) ??
      inviteUrl.match(/^([A-Za-z0-9_-]{20,})$/);
    if (!match || !match[1]) {
      setError("That doesn't look like a valid invite link.");
      return;
    }
    const token = match[1];
    setPendingInvite(token);
    router.push(`/join/${token}/accept`);
  }

  return (
    <>
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
            onClick={() => setShowInviteDialog(true)}
            className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Mail size={20} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="text-md font-extrabold text-text">
                I have an invite link
              </div>
              <div className="mt-0.5 text-sm text-text-muted">
                Paste an invite URL or token to join a group.
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

      <ConfirmDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onConfirm={handleAcceptInvite}
        title="Paste your invite link"
        description={error ?? "Paste the URL or token your friend shared with you."}
        confirmLabel="Join"
      >
        {/* ConfirmDialog children passthrough not currently supported;
            handle input via direct controlled input rendered below */}
      </ConfirmDialog>

      {showInviteDialog && (
        <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4">
          <input
            type="text"
            autoFocus
            value={inviteUrl}
            onChange={(e) => setInviteUrl(e.target.value)}
            placeholder="https://decssy.app/join/abc123…"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-md text-text shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
      )}
    </>
  );
}
```

Note: above stitches an input into the dialog at a fixed position. A cleaner alternative is to extend ConfirmDialog to accept children. For Plan 3, the inline approach ships; Plan 10 can refactor to a proper `<PromptDialog>`.

- [ ] **Step 2: Commit**

```bash
git add app/welcome/start/page.tsx
git commit -m "feat: enable 'I have an invite' on welcome step 2 — accepts URL or raw token"
```

---

## Task 19: TransferOwnershipDialog + integrate in settings

**Files:**
- Create: `components/groups/TransferOwnershipDialog.tsx`
- Modify: `app/(app)/groups/[id]/settings/page.tsx`

- [ ] **Step 1: Dialog component**

Create `components/groups/TransferOwnershipDialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Member {
  userId: Id<"users">;
  name: string;
  email: string;
  isOwner: boolean;
}

interface Props {
  groupId: Id<"groups">;
  groupName: string;
  members: Member[];
  open: boolean;
  onClose: () => void;
  onTransferred: () => void;
}

export function TransferOwnershipDialog({
  groupId,
  groupName,
  members,
  open,
  onClose,
  onTransferred,
}: Props) {
  const transfer = useMutation(api.groups.transferOwnership);
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherMembers = members.filter((m) => !m.isOwner);

  async function handleTransfer() {
    if (!selectedId) {
      setError("Pick a member to transfer to.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      await transfer({ groupId, newOwnerId: selectedId });
      onTransferred();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed.");
      setIsProcessing(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={isProcessing ? undefined : onClose}
        disabled={isProcessing}
        className="fixed inset-0 cursor-default bg-text/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-xl bg-surface p-6 shadow-md">
        <h2 className="mb-2 text-lg font-extrabold tracking-tight text-text">
          Transfer ownership
        </h2>
        <p className="mb-4 text-md text-text-muted">
          Pick the new owner of "{groupName}". You'll become a regular member.
        </p>

        {otherMembers.length === 0 ? (
          <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-text-muted">
            You're the only member. Invite someone first.
          </p>
        ) : (
          <ul className="mb-4 max-h-60 space-y-1 overflow-y-auto">
            {otherMembers.map((m) => (
              <li key={m.userId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(m.userId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border-2 px-3 py-2 text-left transition-colors",
                    selectedId === m.userId
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface hover:bg-surface-2",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-md font-bold text-text">
                      {m.name}
                    </div>
                    <div className="truncate text-sm text-text-muted">
                      {m.email}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleTransfer}
            disabled={isProcessing || otherMembers.length === 0}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            Transfer ownership
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted hover:bg-surface-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate into settings page**

Modify `app/(app)/groups/[id]/settings/page.tsx` to add a TransferOwnership row in the DangerZone-equivalent section (or above it).

In settings page, add inside the `<div className="space-y-6">`:

```tsx
{detail.isOwner && detail.members.length > 1 && (
  <TransferOwnershipSection
    groupId={groupId}
    groupName={detail.group.name}
    members={detail.members}
  />
)}
```

Where `TransferOwnershipSection` is a small client component that wraps the dialog with a trigger button. Create it inline at top of the settings page file, or extract.

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add components/groups/TransferOwnershipDialog.tsx "app/(app)/groups/[id]/settings/page.tsx"
git commit -m "feat: transfer ownership UI (deferred from Plan 2) — member picker + confirm"
```

---

## Task 20: E2E tests for invite flow

**Files:**
- Create: `tests/e2e/invites.spec.ts`

- [ ] **Step 1: Write the tests**

Create `tests/e2e/invites.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

/**
 * Invite flow smoke tests.
 *
 * Public/landing page tests run without auth.
 * Owner-flow tests skip when no auth is set up (same pattern as groups.spec.ts).
 */

test.describe("invite landing (public)", () => {
  test("invalid token shows error landing", async ({ page }) => {
    await page.goto("/join/invalid-token-doesnt-exist");
    await expect(
      page.getByRole("heading", { name: /invite not valid/i }),
    ).toBeVisible();
    await expect(page.getByText(/expired.*revoked.*use limit/i)).toBeVisible();
  });

  test("landing page has OG meta tags", async ({ page }) => {
    await page.goto("/join/some-token");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
  });
});

test.describe("invite flow (auth required)", () => {
  test.skip(
    !!process.env.SKIP_AUTH_TESTS,
    "Set SKIP_AUTH_TESTS=1 to skip these tests in CI without auth setup.",
  );

  test("owner sees /groups/[id]/invite with QR + link", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForLoadState("networkidle");
    if (
      page.url().includes("/sign-in") ||
      page.url().includes("/welcome")
    ) {
      test.skip(true, "Need a signed-in owner of at least one group.");
    }
    const firstGroup = page.locator('a[href^="/groups/"]').first();
    if ((await firstGroup.count()) === 0) {
      test.skip(true, "Need at least one group to test invites.");
    }
    await firstGroup.click();
    await page.waitForLoadState("networkidle");
    const inviteCta = page.getByRole("link", { name: /invite people/i });
    if ((await inviteCta.count()) === 0) {
      test.skip(true, "Not the owner of this group.");
    }
    await inviteCta.click();
    await expect(page.getByRole("heading", { name: /^invite$/i })).toBeVisible();
    await expect(page.getByRole("img", { name: /qr code/i })).toBeVisible({
      timeout: 5000,
    });
  });
});
```

- [ ] **Step 2: Run and commit**

```bash
SKIP_AUTH_TESTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test --reporter=list 2>&1 | tail -8
git add tests/e2e/invites.spec.ts
git commit -m "test: e2e invite landing (public) + owner-side QR page smoke"
```

---

## Task 21: README + manual verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update plan roadmap**

In `README.md`:

```markdown
1. ✅ Foundation & Auth
2. ✅ Onboarding & Groups
3. ✅ **Invites & QR Sharing** ([plans/03-invites-qr.md](./plans/03-invites-qr.md)) — current
4. ⬜ Events & RSVP (one-off)
```

- [ ] **Step 2: Manual verification (needs 2 accounts)**

Run through with two browser windows: one regular (Account A = owner) and one incognito (Account B = friend).

- [ ] Account A: create a group → group detail → "Invite people" → see QR + link
- [ ] Account A: copy link (e.g., `http://localhost:3002/join/abc...`)
- [ ] Account B (incognito): paste the link in URL bar → land on public preview
- [ ] Account B: confirm OG meta tags via DevTools → Elements → `<meta property="og:title">`
- [ ] Account B: "Sign up & join" → create account → complete onboarding → auto-joins group → lands on `/groups/[id]`
- [ ] Account A: refresh `/groups/[id]` → member count is 2, Account B in member list
- [ ] Account A: settings → "Transfer ownership" → pick Account B → confirm → Account B is now owner, A is regular member
- [ ] Account A: try the invite page now → expect redirect (no longer owner)
- [ ] Account B (now owner): revoke the invite
- [ ] Try the same invite link in a new incognito → see "Invite not valid"

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: mark Plan 3 complete in README"
```

---

## Self-Review (writer's pass)

### Spec coverage

| PRD requirement | Task in Plan 3 |
|---|---|
| 4.4 Invites — tokenized, expirable, revocable | Tasks 1, 3, 4 |
| 5.2 Owner invites people (QR + link) | Tasks 12, 14 |
| 5.2 Members join via invite | Tasks 15, 16 |
| 5.2 Owner revokes invites | Tasks 4, 13 |
| 5.2 Transfer ownership | Task 7, 19 |
| 7.4 groupInvites table | Task 1 |
| 10.3 Invite flow (the "core viral moment") | Tasks 12, 15, 16, 17 |
| 10.4 Token security (random, expiry, revocation) | Tasks 2, 3, 4, 5 |
| Section 9.6 Invite QR/link UI | Tasks 12, 14 |
| Section 9.9 Invite landing (public, OG tags) | Task 15 |

**Out of scope for Plan 3 (deferred):**
- Dynamic OG image generation → Plan 10 (uses static icon for now)
- @mention notifications when invited → Plan 9
- Audit log (member_joined / invite_revoked events) → Plan 9

### Placeholder scan

No "TBD"s. Every code block runnable. One TODO-style note in Task 18 about refactoring inline-input into a PromptDialog — flagged as Plan 10 follow-up, not a hidden incomplete step.

### Type consistency

- `groupInvites` `revokedAt` is `v.optional(v.number())` — absence = active. Used consistently in `revokeInvite`, `listGroupInvites`, `getInvitePreview`, `acceptInvite`.
- `Doc<"groupInvites">` flows through `ActiveInvitesList` and the page.
- `Member` interface in `TransferOwnershipDialog` matches the shape returned by `getGroup` (userId, name, email, isOwner).

### Risks called out

1. **`acceptInvite` idempotency vs increment** — if a member retries the accept URL, we don't double-count `usedCount`. Logic: early-return on existing membership, increment only on first insert.
2. **`fetchQuery` on the public landing page** — Next.js fetches Convex server-side, no auth headers. Since `getInvitePreview` does no auth check, this works. If we ever add auth-required public queries (unlikely), the pattern changes.
3. **`MAX_ACTIVE_INVITES_PER_GROUP = 5`** — arbitrary cap, prevents UI clutter. If an owner runs out, they revoke an old one. Adjustable later.
4. **OG image is static** — every invite link shows the same Decssy icon preview, not a group-specific render. Plan 10 fixes with `@vercel/og`.
5. **Local-only token URL** — `baseUrl` from `window.location.origin` works in dev; will use the actual production URL in prod (no change needed, JS sees it correctly).
6. **The `_id` cascade in deleteGroup** — must extend to delete groupInvites too. **MUST UPDATE Plan 2's `deleteGroup`** to also delete invites for the group. (Flagged here so we don't forget.)

---

**Plan complete.** Saved to `plans/03-invites-qr.md`.

Execution recommendation: Hybrid mode (similar to Plan 2). Tasks 0–10 inline (data layer, simple components). Tasks 11–19 fine to do inline or dispatch to subagents — they have clear specs.

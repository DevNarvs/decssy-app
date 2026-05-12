# Decssy

A mobile-first social calendar web app for friend groups.

> See [PRD.md](./PRD.md) for the full product spec, [DESIGN_BRIEF.md](./DESIGN_BRIEF.md) for visual direction, and [plans/](./plans/) for implementation plans.

---

## Tech stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript 5 strict
- **Styling**: Tailwind CSS 4 + Peach Fuzz design tokens (see [PRD §16.5](./PRD.md))
- **Components**: shadcn/ui primitives + Lucide icons + Plus Jakarta Sans
- **Backend**: Convex (database + reactive queries + serverless functions)
- **Auth**: Convex Auth (`@convex-dev/auth`) — Google OAuth + email/password
- **Hosting**: Vercel (frontend) + Convex Cloud (backend)
- **PWA**: installable on phones + tablets via web manifest + service worker

---

## Quick start

### Prerequisites

- **Node.js 20.x or 22.x** (`node -v` to verify)
- **A Convex account** at https://convex.dev (free)
- **A Google Cloud project** with OAuth Client ID + Secret (free, see step 4 below)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.local.example .env.local
# NEXT_PUBLIC_CONVEX_URL is auto-populated in the next step

# 3. Initialize Convex (first time only)
npx convex dev
# - Browser opens — log in to convex.dev
# - "Create a new project?" → Yes → name it "decssy"
# - "Save deployment URL to .env.local?" → Yes
# Leave this terminal running.

# 4. Bootstrap Convex Auth keys + JWT issuer config
npx @convex-dev/auth --web-server-url "http://localhost:3000"
# This sets JWT_PRIVATE_KEY and JWKS in your Convex deployment env
# and creates convex/auth.config.ts.

# 5. Create a Google OAuth client
# https://console.cloud.google.com/apis/credentials
# - Application type: Web application
# - Authorized JavaScript origins: http://localhost:3000
# - Authorized redirect URIs: https://<your-deployment>.convex.site/api/auth/callback/google
# Copy Client ID and Client Secret.

# 6. Set OAuth secrets in Convex env (NOT .env.local — Convex env)
npx convex env set AUTH_GOOGLE_ID "<your-client-id>.apps.googleusercontent.com"
npx convex env set AUTH_GOOGLE_SECRET "GOCSPX-<your-secret>"
npx convex env set SITE_URL "http://localhost:3000"

# 7. In a separate terminal, run the Next.js dev server
npm run dev
```

Open **http://localhost:3000** → you should be redirected to `/sign-in`.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Production server (after build) |
| `npm test` | Vitest unit tests (when present) |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npx convex dev` | Convex backend watcher (run alongside Next dev) |
| `npx convex env list` | View deployment env vars |
| `node scripts/gen-icons.mjs` | Regenerate PWA icons |

---

## Project structure

```
decssy/
├─ app/                            # Next.js App Router
│  ├─ (app)/                       # Auth-protected routes
│  │  ├─ layout.tsx                # Adaptive nav (bottom tabs / sidebar)
│  │  ├─ calendar/page.tsx         # Plan 5
│  │  ├─ groups/page.tsx           # Plan 2
│  │  ├─ find/page.tsx             # Plan 8
│  │  └─ inbox/page.tsx            # Plan 9
│  ├─ sign-in/page.tsx
│  ├─ sign-up/page.tsx
│  ├─ layout.tsx                   # Root: fonts + providers + SW registrar
│  ├─ globals.css                  # Tailwind 4 @theme tokens
│  └─ page.tsx                     # Redirects to /calendar
├─ components/
│  ├─ auth/                        # AuthCard, AuthForm, GoogleIcon
│  ├─ nav/                         # BottomTabBar, SidebarNav, SignOutButton
│  └─ providers/                   # Convex + SW registrar
├─ convex/                         # Convex schema, queries, mutations
│  ├─ schema.ts                    # authTables + extended users + groups
│  ├─ auth.ts                      # Provider config (Google + Password)
│  ├─ auth.config.ts               # JWT issuer config
│  ├─ http.ts                      # Auth.addHttpRoutes(http)
│  ├─ users.ts                     # getCurrentUser, setTimezone
│  └─ lib/enums.ts                 # Placeholder for Plan 4
├─ lib/
│  ├─ env.ts                       # Type-safe env access
│  └─ utils.ts                     # cn() helper
├─ public/
│  ├─ manifest.webmanifest         # PWA manifest
│  ├─ sw.js                        # Service worker
│  └─ icons/                       # PWA icons
├─ scripts/
│  └─ gen-icons.mjs                # Regenerate PWA icons
├─ middleware.ts                   # Convex Auth route protection
├─ next.config.ts                  # PWA caching headers
└─ tsconfig.json                   # Strict TypeScript
```

---

## Implementation plans

This project is built incrementally across 10 plans. Each plan ships working, testable software.

1. ✅ Foundation & Auth ([plans/01-foundation-auth.md](./plans/01-foundation-auth.md))
2. ✅ Onboarding & Groups ([plans/02-onboarding-groups.md](./plans/02-onboarding-groups.md))
3. ✅ Invites & QR Sharing ([plans/03-invites-qr.md](./plans/03-invites-qr.md))
4. ✅ Events & RSVP (one-off) ([plans/04-events-rsvp.md](./plans/04-events-rsvp.md))
5. ✅ **Calendar UI** ([plans/05-calendar-ui.md](./plans/05-calendar-ui.md)) — current
6. ⬜ Event Detail & Comments (merged into Plan 4)
7. ⬜ Recurring Events
8. ⬜ Find Free Day
9. ⬜ Notifications
10. ⬜ Polish & Launch

---

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `POST /api/auth 400` | JWT keys missing in Convex env | Run `npx @convex-dev/auth` once |
| `redirect_uri_mismatch` on Google sign-in | Port mismatch between Google OAuth origins and dev server | Add `http://localhost:<actual-port>` to Authorized JavaScript origins in Google Cloud |
| `Calendar` shows "Loading session..." forever | `convex dev` watcher not running OR auth.config.ts not deployed | Run `npx convex dev --once` to push pending changes |
| `manifest.webmanifest 404` in dev | Browser hard-cache after first 404 | Hard refresh (Ctrl+Shift+R) |
| TypeScript can't find `api.users.getCurrentUser` | Generated API is stale | Run `npx convex dev --once` to regenerate |
| Onboarding redirect loop | `decssy_onboarded` cookie missing/cleared | Re-complete onboarding once, OR set `document.cookie = "decssy_onboarded=1; path=/"` in DevTools and refresh |
| Plan 2 e2e tests all skip | Test browser isn't signed in | Either sign in manually once via http://localhost:3002, or skip with `SKIP_AUTH_TESTS=1` |
| QR code stays "Generating QR…" forever | Convex `qr` action not deployed | Run `npx convex dev --once`; the action lives at `convex/qr.ts` ("use node" runtime) |
| Invite link callback `redirect_uri_mismatch` | Forgot to register the new domain in Google OAuth | Add the prod URL to "Authorized JavaScript origins"; Convex callback URL stays `.convex.site` |

---

## Contributing

This is a freelance project; not currently accepting external PRs. See [plans/](./plans/) for the roadmap.

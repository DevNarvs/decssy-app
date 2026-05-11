/**
 * Decssy server-side auth configuration.
 *
 * Uses @convex-dev/auth — Convex's first-party auth library backed by
 * Auth.js providers. This file declares which authentication methods are
 * available; the library handles JWT signing, session storage in Convex,
 * and OAuth callback routing (see ./http.ts).
 *
 * @see https://labs.convex.dev/auth
 */
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

// ─── PROVIDERS ─────────────────────────────────────────────────────────────
//
// 🔧 USER CONTRIBUTION REQUESTED
//
// The `providers` array below currently has just one entry: `Password()` —
// classic email + password sign-up, works out of the box with no OAuth setup.
//
// Decide which additional providers to add based on YOUR users:
//
//   • For friend-group calendars (Decssy's target): users are mostly on
//     phones, so OAuth via Google/Apple gives the highest sign-up conversion
//     (one tap, no email confirmation friction).
//
//   • Magic links (passwordless email) suit users who don't want to manage
//     yet another password but don't have / refuse OAuth.
//
//   • Password is good as a fallback so users always have an account-recovery
//     path that doesn't depend on a third party.
//
// Common combinations:
//   1. Just `Password()`                          ← simplest, current default
//   2. Google + Password                          ← my recommendation for MVP
//   3. Google + Apple + Magic-link + Password     ← maximum coverage
//
// To add OAuth providers, import them and add to the array, then set the
// corresponding secrets in CONVEX env (NOT .env.local):
//
//   npx convex env set AUTH_GOOGLE_ID <client-id>
//   npx convex env set AUTH_GOOGLE_SECRET <client-secret>
//
// Then in this file:
//   import Google from "@auth/core/providers/google";
//   ...
//   providers: [Google, Password()],
//
// ────────────────────────────────────────────────────────────────────────────

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password(),
    // TODO: add OAuth / magic-link providers here once decided.
  ],
});

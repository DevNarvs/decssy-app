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
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

// ─── PROVIDERS ─────────────────────────────────────────────────────────────
//
// Active providers (locked 2026-05-07):
//   1. Google OAuth      — one-tap sign-in for the ~80% of users on Google
//   2. Password (email)  — universal fallback / account recovery path
//
// Required Convex env (set with `npx convex env set <KEY> <VALUE>`):
//   AUTH_GOOGLE_ID      — OAuth client ID from Google Cloud Console
//   AUTH_GOOGLE_SECRET  — OAuth client secret
//   SITE_URL            — public app URL (http://localhost:3000 in dev)
//
// To add more providers later (Apple, magic links, etc.), import them and
// add to the array. See https://labs.convex.dev/auth for the full list.
// ────────────────────────────────────────────────────────────────────────────

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, Password({ reset: ResendOTPPasswordReset })],
});

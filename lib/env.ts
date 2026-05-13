function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.local.example to .env.local and fill in values.`,
    );
  }
  return value;
}

/**
 * Browser/Node env vars accessed by Next.js code.
 *
 * Convex Auth provider secrets (Google client secret, etc.) and the SITE_URL
 * live in CONVEX's deployment env, not here. Set them with:
 *   npx convex env set AUTH_GOOGLE_ID <client-id>
 *   npx convex env set AUTH_GOOGLE_SECRET <client-secret>
 *   npx convex env set SITE_URL <production-url>
 */
export const env = {
  // Convex deployment URL — auto-populated by `npx convex dev`.
  NEXT_PUBLIC_CONVEX_URL: required(
    "NEXT_PUBLIC_CONVEX_URL",
    process.env.NEXT_PUBLIC_CONVEX_URL,
  ),

  // Optional override for share-link base URL. When unset, share components
  // fall back to `window.location.origin` via `getShareBaseUrl()` below —
  // so dev shares point to localhost and prod shares point to the Vercel
  // domain automatically. Set this in `.env.local` only when you need to
  // mimic a different origin (e.g., generate prod-style links while
  // developing locally to test the receive flow).
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

/**
 * Resolves the base URL used to construct share links (QR codes, copy-link,
 * native share). Resolution order:
 *
 *   1. `NEXT_PUBLIC_APP_URL` env var, if set — manual override for testing
 *      the receive flow across environments.
 *   2. `window.location.origin` in the browser — gives the correct origin
 *      automatically: localhost during `npm run dev`, vercel.app on prod.
 *   3. The Vercel prod URL as a server-side fallback. Share dialogs are
 *      client-only so this branch is essentially unreachable; it exists
 *      only so server-rendered HTML doesn't crash if someone imports this
 *      during SSR.
 */
export function getShareBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://decssy-app.vercel.app";
}

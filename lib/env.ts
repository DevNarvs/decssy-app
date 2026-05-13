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

  // Public app URL — used for share links (event invites, group invites).
  //
  // Default is the production Vercel URL so share links work even when
  // generated from local dev (recipients open the prod app, not localhost).
  // Override in .env.local with `NEXT_PUBLIC_APP_URL=http://localhost:3002`
  // if you specifically want share links to point to your local dev (rare
  // — usually only useful when testing the receive-side flow locally).
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? "https://decssy-app.vercel.app",
};

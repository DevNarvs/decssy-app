"use client";

/**
 * Client-side Convex + Auth provider.
 *
 * `ConvexAuthNextjsProvider` wraps the app in Convex's reactive client AND
 * the auth context. Components inside can use:
 *   - useQuery / useMutation (Convex reactive data)
 *   - useAuthActions (signIn, signOut)
 *   - useConvexAuth (isAuthenticated, isLoading)
 *
 * Pairs with `ConvexAuthNextjsServerProvider` in app/layout.tsx, which
 * synchronises auth state with the server (cookies, SSR-aware redirects).
 */
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { env } from "@/lib/env";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}

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

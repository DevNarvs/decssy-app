"use client";

/**
 * Stores an invite token in localStorage so it survives the sign-in/sign-up
 * round-trip. After auth, the calendar/welcome page checks the storage and
 * redirects to /join/[token]/accept to consume the token.
 *
 * Why localStorage and not a URL param: the Convex Auth sign-in flow doesn't
 * cleanly propagate query strings through the post-auth redirect. Storage
 * is simpler, survives the OAuth round-trip, and we clear it after use.
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

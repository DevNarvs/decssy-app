"use client";

/**
 * Stores an invite token so it survives the sign-in/sign-up OAuth round-trip.
 * After auth, the calendar/welcome page checks the storage and redirects to
 * /join/[token]/accept to consume the token.
 *
 * We write to BOTH localStorage AND a cookie (belt-and-suspenders):
 *   - localStorage is fast and synchronous, ideal for client-side reads.
 *   - Cookies survive iOS Safari Private Browsing and Intelligent Tracking
 *     Prevention modes that sometimes clear localStorage during cross-
 *     origin navigations like OAuth callbacks.
 *
 * Reading falls back from localStorage → cookie, so even one of them being
 * cleared by the browser won't break the flow. We clear both on consume.
 */
const KEY = "decssy_pending_invite";
const COOKIE_MAX_AGE_SECONDS = 60 * 30; // 30 min — long enough for OAuth + onboarding

function setCookie(value: string): void {
  if (typeof document === "undefined") return;
  // path=/ so every route reads it; samesite=lax so it survives the OAuth
  // top-level redirect back from Google/Convex. No `secure` flag because
  // local dev runs on http://localhost; in prod the browser auto-upgrades.
  document.cookie = `${KEY}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${KEY}=([^;]+)`));
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

function clearCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${KEY}=; path=/; max-age=0; samesite=lax`;
}

export function setPendingInvite(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // localStorage can throw in private modes; cookie is still set below.
  }
  setCookie(token);
}

export function getPendingInvite(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
  } catch {
    // fall through to cookie
  }
  return readCookie();
}

export function clearPendingInvite(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  clearCookie();
}

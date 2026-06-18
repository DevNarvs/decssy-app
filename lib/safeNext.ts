/**
 * Validate a post-auth `?next=` redirect target to prevent open redirects.
 *
 * Only same-origin absolute paths are allowed. Everything else returns null
 * so callers fall back to a safe default. Rejected:
 *   - non-path values ("https://evil.com", "evil.com")
 *   - protocol-relative URLs ("//evil.com" — the browser treats these as
 *     absolute to another origin)
 *   - backslash tricks ("/\\evil.com", which some browsers normalize to
 *     "//evil.com")
 *
 * Used everywhere a user-supplied `next` is turned into a navigation:
 * AuthForm, middleware sign-in redirect, and the /join + /e accept flows.
 * Keeping it in one place stops the rule from drifting between call sites.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null; // must be an absolute in-app path
  if (raw.startsWith("//")) return null; // protocol-relative → external origin
  if (raw.startsWith("/\\")) return null; // backslash trick → external origin
  return raw;
}

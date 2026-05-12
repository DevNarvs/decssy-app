/**
 * URL-safe random tokens for group invites.
 *
 * Uses base64url over crypto.getRandomValues; ~143 bits of entropy in 24 chars
 * — enough that brute-forcing an active invite is computationally infeasible
 * even at internet scale.
 *
 * Returns a 24-char string from [A-Za-z0-9-_].
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(18); // 18 bytes → 24 base64url chars
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

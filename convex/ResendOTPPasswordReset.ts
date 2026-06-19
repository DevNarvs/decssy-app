/**
 * Password-reset email provider for @convex-dev/auth's Password provider.
 *
 * Uses the library's Email() provider (NOT @auth/core/providers/resend, which
 * would pull the uninstalled `resend` SDK). We only supply how to generate the
 * OTP and how to send it — the library stores/expires the code in the existing
 * authVerificationCodes table (no schema change) and, because the code is short
 * (< 24 chars), enforces that the same email is re-supplied at verification
 * (its default `authorize`), which we deliberately keep to prevent using a code
 * minted for another account.
 */
import { Email } from "@convex-dev/auth/providers/Email";
import { internal } from "./_generated/api";

const OTP_DIGITS = "0123456789";

export const ResendOTPPasswordReset = Email({
  id: "resend-otp-reset",
  maxAge: 60 * 15, // 15 minutes
  // Keep the DEFAULT authorize (email must match the code's account).
  async generateVerificationToken() {
    // 8-digit numeric OTP from CSPRNG bytes. Modulo-10 bias over 256 is
    // negligible for a short-lived single-use code.
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let code = "";
    for (const b of bytes) code += OTP_DIGITS[b % 10];
    return code;
  },
  // The installed types declare a single-param sendVerificationRequest (it
  // extends Auth.js's EmailConfig), but @convex-dev/auth invokes it with a
  // second `ctx` arg at runtime (confirmed in Email.js / signIn.js). Cast to
  // bridge that gap; the runtime shape is what matters here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendVerificationRequest: (async (
    { identifier: email, token }: { identifier: string; token: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: any,
  ) => {
    await ctx.runAction(internal.email.sendPasswordResetCode, {
      to: email,
      code: token,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any,
});

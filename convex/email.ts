/**
 * Email sender. Env-gated: works without setup (logs to console) and
 * activates when AUTH_RESEND_API_KEY is set in Convex env.
 */
"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const FROM_ADDRESS = "Decssy <noreply@decssy.app>"; // user must verify domain at resend.com

export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
  },
  handler: async (_ctx, { to, subject, text }): Promise<void> => {
    const apiKey = process.env.AUTH_RESEND_API_KEY;
    if (!apiKey) {
      console.log(
        `[email:dev-stub] would send to=${to} subject="${subject}"\n${text}`,
      );
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "<no body>");
      console.warn(
        `[email] Resend failed (${res.status}): ${errBody.slice(0, 200)}`,
      );
    }
  },
});

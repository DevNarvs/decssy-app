/**
 * Convex cron registry.
 *
 * processEmailQueue: every 1 min, picks up notifications with no
 * emailSentAt and dispatches via email.sendEmail (gated by per-user prefs).
 */
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type NotificationType = Doc<"notifications">["type"];

// Default email opt-in per type (PRD §12.4). comment_added defaults off — high noise.
function defaultEmailOptIn(type: NotificationType): boolean {
  return type !== "comment_added";
}

export const processEmailQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("notifications")
      .withIndex("by_email_pending", (q) => q.eq("emailSentAt", undefined))
      .order("asc")
      .take(50);

    for (const n of pending) {
      const user = await ctx.db.get(n.userId);
      if (!user || !user.email) {
        // Can't email; still mark to avoid retry loop.
        await ctx.db.patch(n._id, { emailSentAt: Date.now() });
        continue;
      }

      const pref = user.notificationEmailPrefs?.[n.type];
      const shouldSend =
        pref === undefined ? defaultEmailOptIn(n.type) : pref === true;

      if (shouldSend) {
        await ctx.scheduler.runAfter(0, internal.email.sendEmail, {
          to: user.email,
          subject: `Decssy: ${n.message.slice(0, 80)}`,
          text:
            `${n.message}\n\n` +
            `Open Decssy to respond: ${process.env.SITE_URL ?? "https://decssy.app"}/inbox\n\n` +
            `Manage email preferences in your Decssy settings.`,
        });
      }
      await ctx.db.patch(n._id, { emailSentAt: Date.now() });
    }
  },
});

const crons = cronJobs();
crons.interval(
  "process email queue",
  { minutes: 1 },
  internal.crons.processEmailQueue,
);
export default crons;

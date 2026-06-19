/**
 * Convex cron registry.
 *
 * processEmailQueue: every 1 min, picks up notifications with no
 * emailSentAt and dispatches via email.sendEmail (gated by per-user prefs).
 *
 * generateEventReminders: every 5 min, fires "starts tomorrow" (24h) and
 * "starts in 1 hour" reminders for upcoming event occurrences.
 */
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { expandOccurrences } from "./lib/recurrence";
import { createNotification } from "./notifications";

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

// ── Event reminders ──────────────────────────────────────────────────────
// Two lead windows; the cron runs every 5 min and a ~6-min slack window means
// a skipped/late run still catches occurrences (the eventReminders dedup table
// makes any overlap harmless — never double-sends).
const REMINDER_LEADS = [
  { key: "24h" as const, ms: 24 * 60 * 60 * 1000, label: "tomorrow" },
  { key: "1h" as const, ms: 60 * 60 * 1000, label: "in 1 hour" },
];
const REMINDER_SLACK_MS = 6 * 60 * 1000;

export const generateEventReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const horizon = now + 24 * 60 * 60 * 1000 + REMINDER_SLACK_MS;

    // O(all events) like listMyEventsInRange — fine at PRD scale. Recurring
    // events are expanded so each occurrence is reminded on its own schedule.
    const events = await ctx.db.query("events").collect();
    for (const e of events) {
      if (e.deletedAt !== undefined) continue;
      const occurrences = expandOccurrences(e, now, horizon);
      for (const occ of occurrences) {
        for (const lead of REMINDER_LEADS) {
          const fireStart = now + lead.ms;
          const fireEnd = fireStart + REMINDER_SLACK_MS;
          if (occ.startUtc < fireStart || occ.startUtc >= fireEnd) continue;

          const attendees = await ctx.db
            .query("eventAttendees")
            .withIndex("by_event", (q) => q.eq("eventId", e._id))
            .collect();
          for (const a of attendees) {
            if (a.status === "declined") continue;

            // Dedup on the specific OCCURRENCE (recurring events reuse the
            // parent _id), the user, and the lead window.
            const already = await ctx.db
              .query("eventReminders")
              .withIndex("by_dedup", (q) =>
                q
                  .eq("eventId", e._id)
                  .eq("occurrenceStartUtc", occ.startUtc)
                  .eq("userId", a.userId)
                  .eq("leadKey", lead.key),
              )
              .unique();
            if (already) continue;

            await ctx.db.insert("eventReminders", {
              eventId: e._id,
              occurrenceStartUtc: occ.startUtc,
              userId: a.userId,
              leadKey: lead.key,
              createdAt: now,
            });
            // No actorUserId — so the creator (also an attendee) is reminded.
            // createNotification still skips muted groups.
            await createNotification(ctx, {
              userId: a.userId,
              type: "event_reminder",
              groupId: e.groupId,
              eventId: e._id,
              actorName: "Decssy",
              message: `"${e.title}" starts ${lead.label}`,
            });
          }
        }
      }
    }
  },
});

const crons = cronJobs();
crons.interval(
  "process email queue",
  { minutes: 1 },
  internal.crons.processEmailQueue,
);
crons.interval(
  "generate event reminders",
  { minutes: 5 },
  internal.crons.generateEventReminders,
);
export default crons;

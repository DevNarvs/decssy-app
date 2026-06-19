/**
 * Web Push sender (Node runtime — the web-push lib needs Node APIs).
 *
 * A "use node" Convex file can contain ONLY actions and cannot touch ctx.db
 * directly, so it reads subscriptions via ctx.runQuery and prunes dead ones
 * via ctx.runMutation (both in convex/push.ts).
 *
 * Triggered by createNotification (convex/notifications.ts) via
 * scheduler.runAfter, so every push respects the same self-skip + per-group
 * mute guards as the in-app notification.
 *
 * Requires Convex env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
 * If they're unset the action no-ops (push stays off until configured).
 */
"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

export const sendPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.string(),
  },
  handler: async (ctx, { userId, title, body, url }) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) {
      // Push not configured — nothing to do.
      return;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subs = await ctx.runQuery(internal.push._listForUser, { userId });
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: "/icons/icon-192.png",
    });

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
        } catch (err: unknown) {
          // 404 (expired) / 410 (gone) → the subscription is permanently dead;
          // prune it so we stop wasting sends. Other errors: log and move on.
          const statusCode =
            typeof err === "object" && err !== null && "statusCode" in err
              ? (err as { statusCode?: number }).statusCode
              : undefined;
          if (statusCode === 404 || statusCode === 410) {
            await ctx.runMutation(internal.push._deleteByEndpoint, {
              endpoint: s.endpoint,
            });
          } else {
            console.warn("[push] send failed", statusCode);
          }
        }
      }),
    );
  },
});

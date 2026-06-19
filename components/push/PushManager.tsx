"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Bell, BellRing, Loader2, Share } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

/** VAPID public key (base64url) → Uint8Array for applicationServerKey. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Back with an explicit ArrayBuffer so the type is Uint8Array<ArrayBuffer>,
  // which is what PushManager.subscribe's applicationServerKey expects.
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag for home-screen apps.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Push notification opt-in. Hidden entirely when push isn't configured (no
 * VAPID key) or unsupported. On iOS, push only works from a home-screen-
 * installed PWA, so we show "Add to Home Screen" guidance instead of a dead
 * subscribe button. Permission is requested from a real click (iOS requires
 * a user gesture).
 */
export function PushManager() {
  const save = useMutation(api.push.savePushSubscription);
  const remove = useMutation(api.push.deletePushSubscription);

  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    // iOS in a browser tab (not installed) can't do push at all.
    if (isIos() && !isStandalone()) {
      setNeedsInstall(true);
      return;
    }
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, []);

  // Push not configured at all → render nothing.
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;

  async function enable() {
    setError(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications are blocked. Enable them in your browser settings.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      const j = sub.toJSON();
      if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) {
        setError("Couldn't read the subscription. Try again.");
        return;
      }
      await save({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth });
      setSubscribed(true);
    } catch (err) {
      console.warn("push enable failed:", err);
      setError("Couldn't turn on push notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setError(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await remove({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.warn("push disable failed:", err);
      setError("Couldn't turn off push notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-text-muted">
        Push notifications
      </h2>

      {needsInstall ? (
        <div className="flex items-start gap-2 text-sm text-text-muted">
          <Share size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" />
          <span>
            To get push notifications on iPhone/iPad, first add Decssy to your
            Home Screen: tap the <span className="font-bold text-text">Share</span>{" "}
            button, then{" "}
            <span className="font-bold text-text">Add to Home Screen</span>. Open
            it from there and come back to this screen.
          </span>
        </div>
      ) : !supported ? (
        <p className="text-sm text-text-muted">
          This browser doesn't support push notifications.
        </p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              {subscribed ? (
                <BellRing size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" />
              ) : (
                <Bell size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-muted" />
              )}
              <div className="min-w-0">
                <div className="text-md font-bold text-text">
                  {subscribed ? "Push is on" : "Get push notifications"}
                </div>
                <div className="text-sm text-text-muted">
                  {subscribed
                    ? "Invites, updates, and reminders arrive on this device."
                    : "Be notified on this device even when Decssy is closed."}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={subscribed ? disable : enable}
              disabled={busy || subscribed === null}
              className={cn(
                "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-extrabold transition-colors",
                subscribed
                  ? "border border-border bg-surface text-text-muted hover:bg-surface-2"
                  : "bg-accent text-white shadow-fab hover:bg-accent/90",
                (busy || subscribed === null) && "cursor-not-allowed opacity-60",
              )}
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {subscribed ? "Turn off" : "Turn on"}
            </button>
          </div>
          {error && (
            <div className="mt-2 rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative">
              {error}
            </div>
          )}
        </>
      )}
    </section>
  );
}

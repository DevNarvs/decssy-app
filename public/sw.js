/**
 * Decssy minimal service worker.
 *
 * Job for Plan 1: just enough to make the app *installable* as a PWA.
 * Plan 10 (Polish) replaces this with an offline cache strategy
 * (network-first for /api/* and Convex calls; cache-first for static
 * assets; offline fallback for /calendar).
 */

// Do NOT skipWaiting here: when an update is found we let the new worker WAIT
// so the app can show an "Update available" banner and the user controls when
// to refresh (the page posts SKIP_WAITING below). First installs (no existing
// controller) still activate immediately, so push works for new installs.
self.addEventListener("install", () => {});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// The page (ServiceWorkerRegistrar) posts this when the user taps "Refresh"
// on the update banner — activate the waiting worker, which fires
// controllerchange on the page and triggers a reload.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Empty fetch handler — browsers ignore PWAs without one for installability.
// The network handles all requests; no caching yet.
self.addEventListener("fetch", () => {});

// ── Web Push ───────────────────────────────────────────────────────────────
// Payload is JSON from convex/pushNode.ts: { title, body, url, icon }.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Decssy", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Decssy", {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/inbox" },
    }),
  );
});

// Focus an existing tab at the target URL, or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/inbox";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(target) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});

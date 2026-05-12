/**
 * Decssy minimal service worker.
 *
 * Job for Plan 1: just enough to make the app *installable* as a PWA.
 * Plan 10 (Polish) replaces this with an offline cache strategy
 * (network-first for /api/* and Convex calls; cache-first for static
 * assets; offline fallback for /calendar).
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Empty fetch handler — browsers ignore PWAs without one for installability.
// The network handles all requests; no caching yet.
self.addEventListener("fetch", () => {});

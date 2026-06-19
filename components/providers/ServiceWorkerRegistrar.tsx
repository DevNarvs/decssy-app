"use client";

/**
 * Registers /sw.js in production builds only (in dev the SW causes stale-cache
 * headaches across hot reloads), and surfaces an "Update available" banner
 * when a new deploy is detected.
 *
 * How update detection works: we register the worker as `/sw.js?v=<version>`,
 * so each deploy (new git SHA) is a distinct script URL → the browser installs
 * a new worker, which WAITS (sw.js no longer auto-skipWaiting). We catch that
 * waiting worker and show the banner; tapping "Refresh" posts SKIP_WAITING,
 * the worker activates, `controllerchange` fires, and we reload once.
 */
import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { env } from "@/lib/env";

export function ServiceWorkerRegistrar() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let cleanupVisibility: (() => void) | undefined;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register(
          // Use the build id (git SHA), not the semver — it changes on every
          // deploy, so two releases sharing a version number still update.
          `/sw.js?v=${env.NEXT_PUBLIC_APP_BUILD}`,
          { scope: "/" },
        );

        // An update may already be waiting (installed while the app was closed).
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaiting(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          const incoming = reg.installing;
          if (!incoming) return;
          incoming.addEventListener("statechange", () => {
            // "installed" + an existing controller = this is an UPDATE (not a
            // first install), so it's safe to offer a refresh.
            if (incoming.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(incoming);
            }
          });
        });

        // Proactively re-check for updates each time the app regains focus.
        const onVisible = () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        };
        document.addEventListener("visibilitychange", onVisible);
        cleanupVisibility = () =>
          document.removeEventListener("visibilitychange", onVisible);
      } catch (err) {
        console.warn("Service worker registration failed:", err);
      }
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      cleanupVisibility?.();
    };
  }, []);

  function refresh() {
    // Tell the waiting worker to take over; controllerchange will reload.
    waiting?.postMessage({ type: "SKIP_WAITING" });
  }

  if (!waiting || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "calc(72px + var(--safe-bottom, 0px))" }}
    >
      <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-md">
        <RefreshCw size={18} strokeWidth={1.5} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-text">Update available</div>
          <div className="truncate text-sm text-text-muted">
            A new version of Decssy is ready.
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex h-9 shrink-0 items-center rounded-md bg-accent px-3 text-sm font-extrabold text-white transition-colors hover:bg-accent/90"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-2"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

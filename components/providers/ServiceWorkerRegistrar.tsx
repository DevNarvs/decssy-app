"use client";

/**
 * Registers /sw.js in production builds only. In dev, the service worker
 * causes stale-cache headaches across hot reloads, so we skip registration
 * when NODE_ENV !== "production".
 *
 * Rendered once in the root layout — returns null because it has no UI.
 */
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("Service worker registration failed:", err));
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}

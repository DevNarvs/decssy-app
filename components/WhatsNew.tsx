"use client";

/**
 * Shows a "What's new" modal once per version that has a highlights entry.
 * "Seen" state lives in localStorage keyed by the last-acknowledged version;
 * the modal shows whenever that differs from the current version (so each
 * version's highlights are seen exactly once). For the 1.0 launch this also
 * greets first-time users with a feature-discovery reel.
 */
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { env } from "@/lib/env";
import { whatsNewFor, type WhatsNewEntry } from "@/lib/whatsNew";

const SEEN_KEY = "decssy_whatsnew_seen";

export function WhatsNew() {
  const [entry, setEntry] = useState<WhatsNewEntry | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = env.NEXT_PUBLIC_APP_VERSION;
    const match = whatsNewFor(current);
    if (!match) return; // nothing to announce for this version

    let seen: string | null = null;
    try {
      seen = localStorage.getItem(SEEN_KEY);
    } catch {
      return; // storage blocked — skip silently
    }

    // Show once whenever the acknowledged version differs from the current
    // one (null on a fresh device counts as "different").
    if (seen !== current) {
      setEntry(match);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, env.NEXT_PUBLIC_APP_VERSION);
    } catch {
      /* ignore */
    }
    setEntry(null);
  }

  // Lock body scroll while open.
  useEffect(() => {
    if (!entry) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [entry]);

  if (!entry) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsnew-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="fixed inset-0 cursor-default bg-text/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-xl bg-surface p-6 shadow-md">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sparkles size={24} strokeWidth={1.5} />
        </div>
        <h2
          id="whatsnew-title"
          className="text-lg font-extrabold tracking-tight text-text"
        >
          {entry.title}
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          Here's what's new in v{entry.version}.
        </p>

        <ul className="space-y-2.5">
          {entry.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-3">
              <span aria-hidden="true" className="text-lg leading-none">
                {h.emoji}
              </span>
              <span className="text-md text-text">{h.text}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={dismiss}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

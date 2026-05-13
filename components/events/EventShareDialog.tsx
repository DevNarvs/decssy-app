"use client";

/**
 * Event-level share dialog.
 *
 * Shows a QR code + copyable link + native-share button for a specific
 * event. The link routes to the event detail page; group members open it
 * straight, non-members hit the auth flow first.
 */
import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { Share2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CopyButton } from "@/components/ui/CopyButton";
import { getShareBaseUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

interface Props {
  groupId: Id<"groups">;
  eventId: Id<"events">;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
}

export function EventShareDialog({
  groupId,
  eventId,
  eventTitle,
  open,
  onClose,
}: Props) {
  const generate = useAction(api.qr.generate);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Origin-based: dev shares point to localhost, prod shares point to the
  // Vercel domain. Override with NEXT_PUBLIC_APP_URL in .env.local when you
  // need to mimic a different origin for cross-environment testing.
  const url = `${getShareBaseUrl()}/groups/${groupId}/events/${eventId}`;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    let cancelled = false;
    generate({ data: url })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch((err) => console.warn("QR generation failed:", err));

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, url, generate, onClose]);

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({
        title: eventTitle,
        text: `Join "${eventTitle}" on Decssy`,
        url,
      });
    } catch {
      // user cancelled — silent
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-share-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-text/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-xl bg-surface p-6 shadow-md">
        <h2
          id="event-share-title"
          className="mb-1 text-lg font-extrabold tracking-tight text-text"
        >
          Share event
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          Anyone in this group can open the link.{" "}
          <span className="text-text">
            People outside the group need an invite first.
          </span>
        </p>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-bg">
            {qrSvg ? (
              <div
                className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                role="img"
                aria-label="QR code for event link"
              />
            ) : (
              <div className="text-sm text-text-muted">Generating QR…</div>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="event-share-url"
              className="mb-1 block text-sm font-bold text-text-muted"
            >
              Or share the link
            </label>
            <div className="flex gap-2">
              <input
                id="event-share-url"
                type="text"
                readOnly
                value={url}
                onClick={(e) => e.currentTarget.select()}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text-muted"
              />
              <CopyButton value={url} />
            </div>
          </div>

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
              )}
            >
              <Share2 size={16} strokeWidth={1.5} />
              Share via…
            </button>
          )}
        </div>

        <button
          type="button"
          ref={closeRef}
          onClick={onClose}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted transition-colors hover:bg-surface-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}

"use client";

/**
 * Event-level share dialog.
 *
 * Shows a QR code + copyable link + native-share button for a specific
 * event. Three URL strategies depending on the event's group:
 *
 *   1. **Event-share link** (PERSONAL "Just me" events): the URL is
 *      `/e/<token>`. The recipient RSVPs and the event lands on their
 *      calendar WITHOUT joining any group. This is the "share the sched,
 *      not the group" path. See convex/eventShares.ts.
 *
 *   2. **Invite-backed link** (social-group owner): the URL routes through
 *      `/join/<token>?next=/groups/<id>/events/<eid>`. Recipients who
 *      aren't in the group join it and land on the event; existing members
 *      flow straight through.
 *
 *   3. **Direct event link** (non-owner of a social group, or token
 *      creation failed): just `/groups/<id>/events/<eid>`. Only current
 *      members can open it; the dialog explains the limitation.
 */
import { useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Share2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CopyButton } from "@/components/ui/CopyButton";
import { getShareBaseUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

type ShareState = "pending" | "eventshare" | "invite" | "direct";

interface Props {
  groupId: Id<"groups">;
  eventId: Id<"events">;
  eventTitle: string;
  /** True if the current user owns this group — invite-backed share is available. */
  isOwner: boolean;
  /** True if this is the auto-created "My Schedule" personal group; cannot be shared. */
  isPersonalDefault: boolean;
  open: boolean;
  onClose: () => void;
}

export function EventShareDialog({
  groupId,
  eventId,
  eventTitle,
  isOwner,
  isPersonalDefault,
  open,
  onClose,
}: Props) {
  const generate = useAction(api.qr.generate);
  const ensureInvite = useMutation(api.invites.ensureActiveInvite);
  const ensureEventShare = useMutation(api.eventShares.ensureEventShare);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // "pending" while the share URL is being resolved (mutation in flight),
  // then one of three resolved modes. Tracking *which* mode (not just
  // "have token / don't") lets us show the right copy and avoid the URL
  // flashing the wrong value mid-resolution.
  const [shareState, setShareState] = useState<ShareState>("pending");
  const [shareError, setShareError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const baseUrl = getShareBaseUrl();
  const directPath = `/groups/${groupId}/events/${eventId}`;
  const url =
    shareState === "eventshare" && token
      ? `${baseUrl}/e/${token}`
      : shareState === "invite" && token
        ? `${baseUrl}/join/${token}?next=${encodeURIComponent(directPath)}`
        : `${baseUrl}${directPath}`;

  // Resolve the share URL on open. Personal "Just me" events use an
  // event-share token (RSVP without joining); social-group events fall back
  // to the group-invite flow (owner) or a direct member-only link.
  useEffect(() => {
    if (!open) return;
    if (shareState !== "pending") return; // already resolved this open

    if (isPersonalDefault) {
      // Personal event → per-event share. Recipient RSVPs, no group join.
      ensureEventShare({ eventId })
        .then((t) => {
          setToken(t);
          setShareState("eventshare");
        })
        .catch((err) => {
          console.warn("ensureEventShare failed:", err);
          setShareState("direct");
          setShareError(
            err instanceof Error
              ? err.message
              : "Couldn't generate a share link; sharing the direct URL instead.",
          );
        });
      return;
    }

    // Social group: only the owner can mint a group invite.
    if (!isOwner) {
      setShareState("direct");
      setShareError(
        "Only the group owner can generate links that work for non-members.",
      );
      return;
    }

    ensureInvite({ groupId })
      .then((t) => {
        setToken(t);
        setShareState("invite");
      })
      .catch((err) => {
        console.warn("ensureActiveInvite failed:", err);
        setShareState("direct");
        setShareError(
          err instanceof Error
            ? err.message
            : "Couldn't generate an invite-backed link; sharing the direct URL instead.",
        );
      });
  }, [
    open,
    shareState,
    isOwner,
    isPersonalDefault,
    ensureInvite,
    ensureEventShare,
    groupId,
    eventId,
  ]);

  // Generate QR only AFTER invite resolution settles — otherwise the QR
  // would render the direct URL momentarily before regenerating for the
  // invite URL, which both looks broken and wastes a Convex action call.
  useEffect(() => {
    if (!open) return;
    if (shareState === "pending") return; // wait for resolution
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

  // Reset state when dialog closes so a subsequent open re-fetches fresh.
  useEffect(() => {
    if (!open) {
      setQrSvg(null);
      setToken(null);
      setShareState("pending");
      setShareError(null);
    }
  }, [open]);

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) return;
    const text =
      shareState === "eventshare"
        ? `RSVP to "${eventTitle}" on Decssy`
        : `Join "${eventTitle}" on Decssy`;
    try {
      await navigator.share({ title: eventTitle, text, url });
    } catch {
      // user cancelled — silent
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  if (!open) return null;

  const isResolving = shareState === "pending";

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
          {isResolving ? (
            <>Preparing share link…</>
          ) : shareState === "eventshare" ? (
            <>
              Anyone with this link can RSVP to{" "}
              <span className="text-text">{eventTitle}</span> — it'll show on
              their calendar. They won't join any group, just this event.
            </>
          ) : shareState === "invite" ? (
            <>
              Anyone with this link can join{" "}
              <span className="text-text">{eventTitle}</span> — they'll be
              added to the group when they open it.
            </>
          ) : (
            <>
              Only current group members can open this link.{" "}
              <span className="text-text">
                Outsiders need a group invite first.
              </span>
            </>
          )}
        </p>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-bg">
            {isResolving ? (
              <Loader2 size={24} className="animate-spin text-accent" />
            ) : qrSvg ? (
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
                value={isResolving ? "Preparing…" : url}
                onClick={(e) => !isResolving && e.currentTarget.select()}
                disabled={isResolving}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text-muted disabled:opacity-60"
              />
              <CopyButton value={url} />
            </div>
          </div>

          {shareError && (
            <div className="flex w-full items-start gap-2 rounded-md border border-maybe/30 bg-maybe/10 px-3 py-2 text-xs text-text-muted">
              <AlertCircle
                size={14}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-maybe"
              />
              <span>{shareError}</span>
            </div>
          )}

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isResolving}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
                "disabled:cursor-not-allowed disabled:opacity-60",
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

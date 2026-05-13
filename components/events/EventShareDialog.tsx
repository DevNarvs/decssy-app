"use client";

/**
 * Event-level share dialog.
 *
 * Shows a QR code + copyable link + native-share button for a specific
 * event. Two URL strategies depending on whether the sharer can grant
 * outsiders access to the group:
 *
 *   1. **Invite-backed link** (group owner, non-personal group): the URL
 *      routes through `/join/<token>?next=/groups/<id>/events/<eid>`.
 *      Recipients who aren't yet in the group go through the join flow
 *      and land on the event; recipients who are already in flow straight
 *      through. Works universally — this is the default.
 *
 *   2. **Direct event link** (non-owner, or invite creation failed): the
 *      URL is just `/groups/<id>/events/<eid>`. Only group members can
 *      open it; outsiders see the "you're not in this group" empty state.
 *      The dialog tells the user this so they know to send a separate
 *      group invite if needed.
 */
import { useEffect, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Share2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CopyButton } from "@/components/ui/CopyButton";
import { getShareBaseUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

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
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  // Tri-state: "pending" while we figure out the URL (mutation in flight),
  // "invite" when we got a token, "direct" when we skipped/failed and are
  // using the direct event URL. Crucial for showing the user *why* — the
  // initial flash of the direct URL while pending was confusing.
  const [inviteState, setInviteState] = useState<"pending" | "invite" | "direct">(
    "pending",
  );
  const [inviteError, setInviteError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const baseUrl = getShareBaseUrl();
  const directPath = `/groups/${groupId}/events/${eventId}`;
  const url = inviteToken
    ? `${baseUrl}/join/${inviteToken}?next=${encodeURIComponent(directPath)}`
    : `${baseUrl}${directPath}`;

  // Try to get an invite token on open (owner only, non-personal group).
  // Recoverable failure: just fall back to the direct URL — recipients
  // still get a useful link if they're already group members.
  useEffect(() => {
    if (!open) return;
    if (inviteState !== "pending") return; // already resolved this open

    // Eligibility short-circuit: only group owners can mint invites, and
    // personal-default groups can't be shared externally regardless.
    if (!isOwner) {
      setInviteState("direct");
      setInviteError(
        "Only the group owner can generate links that work for non-members.",
      );
      return;
    }
    if (isPersonalDefault) {
      setInviteState("direct");
      setInviteError(
        "Personal schedule groups can't be shared externally — they're solo by design.",
      );
      return;
    }

    ensureInvite({ groupId })
      .then((token) => {
        setInviteToken(token);
        setInviteState("invite");
      })
      .catch((err) => {
        console.warn("ensureActiveInvite failed:", err);
        setInviteState("direct");
        setInviteError(
          err instanceof Error
            ? err.message
            : "Couldn't generate an invite-backed link; sharing the direct URL instead.",
        );
      });
  }, [open, inviteState, isOwner, isPersonalDefault, ensureInvite, groupId]);

  // Generate QR only AFTER invite resolution settles — otherwise the QR
  // would render the direct URL momentarily before regenerating for the
  // invite URL, which both looks broken and wastes a Convex action call.
  useEffect(() => {
    if (!open) return;
    if (inviteState === "pending") return; // wait for resolution
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
      setInviteToken(null);
      setInviteState("pending");
      setInviteError(null);
    }
  }, [open]);

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

  const isInviteBacked = inviteState === "invite";
  const isResolving = inviteState === "pending";

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
          ) : isInviteBacked ? (
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

          {inviteError && (
            <div className="flex w-full items-start gap-2 rounded-md border border-maybe/30 bg-maybe/10 px-3 py-2 text-xs text-text-muted">
              <AlertCircle
                size={14}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-maybe"
              />
              <span>{inviteError}</span>
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

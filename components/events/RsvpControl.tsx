"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Check, HelpCircle, X, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { RSVP_STATUSES, type RsvpStatus } from "@/convex/lib/enums";
import { cn } from "@/lib/utils";

type ActiveStatus = Exclude<RsvpStatus, "invited">;

const ACTIONS: { key: ActiveStatus; label: string; Icon: typeof Check }[] = [
  { key: "attending", label: "Going", Icon: Check },
  { key: "maybe", label: "Maybe", Icon: HelpCircle },
  { key: "declined", label: "Can't go", Icon: X },
];

interface Props {
  eventId: Id<"events">;
  currentStatus: string | null;
  eventType: "personal_shared" | "group_shared";
}

export function RsvpControl({ eventId, currentStatus, eventType }: Props) {
  const setRsvp = useMutation(api.rsvp.setRsvp);
  const [pending, setPending] = useState<ActiveStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(next: ActiveStatus) {
    setError(null);
    setPending(next);
    try {
      await setRsvp({ eventId, status: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSVP failed.");
    } finally {
      setPending(null);
    }
  }

  const helperText =
    eventType === "group_shared"
      ? "Group event — you're auto-attending. Change to maybe or can't go below if you can't make it."
      : "Let everyone know.";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-extrabold uppercase tracking-wide text-text-muted">
          Your RSVP
        </span>
        {currentStatus && currentStatus !== "invited" && (
          <span
            className="text-sm font-bold"
            style={{
              color: RSVP_STATUSES[currentStatus as RsvpStatus]?.color,
            }}
          >
            {RSVP_STATUSES[currentStatus as RsvpStatus]?.label}
          </span>
        )}
      </div>
      <p className="mb-2 px-1 text-sm text-text-muted">{helperText}</p>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(({ key, label, Icon }) => {
          const isCurrent = key === currentStatus;
          const isPending = pending === key;
          const color = RSVP_STATUSES[key].color;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleClick(key)}
              disabled={pending !== null}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border-2 py-2.5 text-sm font-extrabold transition-colors",
                isCurrent
                  ? "bg-surface-2"
                  : "border-border bg-surface hover:bg-surface-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                pending !== null && !isPending && "cursor-not-allowed opacity-60",
              )}
              style={{
                borderColor: isCurrent ? color : undefined,
                color: isCurrent ? color : "var(--color-text-muted)",
              }}
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Icon size={16} strokeWidth={2} />
              )}
              {label}
            </button>
          );
        })}
      </div>
      {error && (
        <div
          role="alert"
          className="mt-2 rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
        >
          {error}
        </div>
      )}
    </div>
  );
}

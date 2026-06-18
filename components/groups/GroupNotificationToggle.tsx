"use client";

import { useMutation, useQuery } from "convex/react";
import { BellOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Props {
  groupId: Id<"groups">;
}

/**
 * Per-group notification mute toggle. When muted, the user gets no in-app
 * notifications OR emails for this group (createNotification skips them).
 * The single highest-leverage lever against notification overload — the #1
 * complaint across group-coordination apps.
 */
export function GroupNotificationToggle({ groupId }: Props) {
  const muted = useQuery(api.notifications.isGroupMuted, { groupId });
  const setMuted = useMutation(api.notifications.setGroupMuted);
  const [saving, setSaving] = useState(false);

  // Optimistic display so the toggle feels instant; falls back to the query.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const isMuted = optimistic ?? muted ?? false;
  const isLoading = muted === undefined;

  async function toggle() {
    const next = !isMuted;
    setOptimistic(next);
    setSaving(true);
    try {
      await setMuted({ groupId, muted: next });
    } catch (err) {
      setOptimistic(null); // revert to server truth on failure
      console.warn("setGroupMuted failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-text-muted">
        Notifications
      </h3>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <BellOff
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-text-muted"
          />
          <div className="min-w-0">
            <div className="text-md font-bold text-text">Mute this group</div>
            <div className="text-sm text-text-muted">
              {isMuted
                ? "You won't get notifications or emails from this group."
                : "Stop notifications and emails from this group's events."}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={isLoading || saving}
          role="switch"
          aria-checked={isMuted}
          aria-label="Mute this group"
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors",
            isMuted ? "bg-accent" : "bg-border",
            (isLoading || saving) && "opacity-60",
          )}
        >
          <span
            className={cn(
              "absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white transition-all",
              isMuted ? "left-6" : "left-1",
            )}
          >
            {saving && (
              <Loader2 size={12} className="animate-spin text-text-muted" />
            )}
          </span>
        </button>
      </div>
    </section>
  );
}

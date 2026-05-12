"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

interface ActiveInvitesListProps {
  invites: Doc<"groupInvites">[];
  groupName: string;
}

export function ActiveInvitesList({
  invites,
  groupName,
}: ActiveInvitesListProps) {
  const revokeInvite = useMutation(api.invites.revokeInvite);
  const [confirmTarget, setConfirmTarget] = useState<Id<"groupInvites"> | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleRevoke() {
    if (!confirmTarget) return;
    setIsProcessing(true);
    try {
      await revokeInvite({ inviteId: confirmTarget });
      setConfirmTarget(null);
    } catch (err) {
      console.warn("Revoke failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  if (invites.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        No other active invites. The QR code above is your one and only.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {invites.map((inv) => {
          const expiresIn = Math.ceil(
            (inv.expiresAt - Date.now()) / (1000 * 60 * 60 * 24),
          );
          return (
            <li
              key={inv._id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm text-text">
                  …{inv.token.slice(-8)}
                </div>
                <div className="text-sm text-text-muted">
                  Used {inv.usedCount}× · expires in {expiresIn}d
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTarget(inv._id)}
                className={cn(
                  "rounded-md border border-negative/40 bg-surface px-3 py-1.5 text-xs font-bold text-negative",
                  "hover:bg-negative/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative",
                )}
              >
                Revoke
              </button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmTarget !== null}
        onClose={() => !isProcessing && setConfirmTarget(null)}
        onConfirm={handleRevoke}
        variant="danger"
        isProcessing={isProcessing}
        title="Revoke this invite?"
        description={`Anyone holding this link won't be able to join "${groupName}" anymore. People who already joined are unaffected.`}
        confirmLabel="Yes, revoke"
      />
    </>
  );
}

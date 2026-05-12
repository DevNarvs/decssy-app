"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

interface DangerZoneProps {
  groupId: Id<"groups">;
  isOwner: boolean;
  groupName: string;
}

export function DangerZone({ groupId, isOwner, groupName }: DangerZoneProps) {
  const router = useRouter();
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action: "leave" | "delete" = isOwner ? "delete" : "leave";

  async function handleConfirm() {
    setError(null);
    setIsProcessing(true);
    try {
      // Navigate AWAY first so the reactive useQuery(getGroup) on this
      // route unmounts before the row is gone. getGroup also returns null
      // (not throws) for non-members as a belt-and-suspenders fix — see
      // convex/groups.ts.
      router.push("/groups");
      if (action === "delete") {
        await deleteGroup({ groupId });
      } else {
        await leaveGroup({ groupId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Couldn't ${action} group.`);
      setIsProcessing(false);
      // If error happened, we already started the navigation — push back to
      // this page so the user can see the error. Edge case; rare.
      router.push(`/groups/${groupId}/settings`);
    }
  }

  const dialogProps = isOwner
    ? {
        title: `Delete "${groupName}"?`,
        description:
          "This removes the group and all its members. This cannot be undone.",
        confirmLabel: "Yes, delete it",
      }
    : {
        title: `Leave "${groupName}"?`,
        description:
          "You'll need a new invite link to rejoin. Your past events stay with the group.",
        confirmLabel: "Yes, leave",
      };

  return (
    <>
      <div className="rounded-xl border border-negative/30 bg-negative/5 p-4">
        <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-negative">
          Danger zone
        </h3>

        {error && (
          <div role="alert" className="mb-3 text-sm font-bold text-negative">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={isProcessing}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-negative bg-surface text-md font-extrabold text-negative transition-colors hover:bg-negative/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative",
            isProcessing && "cursor-not-allowed opacity-60",
          )}
        >
          {isOwner ? "Delete this group" : "Leave this group"}
        </button>

        {isOwner && (
          <p className="mt-2 text-sm text-text-muted">
            Owners can't leave — delete the group or transfer ownership (coming
            in the next release) first.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={isDialogOpen}
        onClose={() => !isProcessing && setIsDialogOpen(false)}
        onConfirm={handleConfirm}
        variant="danger"
        isProcessing={isProcessing}
        {...dialogProps}
      />
    </>
  );
}

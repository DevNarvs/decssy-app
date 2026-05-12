"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
  const [pendingAction, setPendingAction] = useState<"leave" | "delete" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    if (!confirm(`Leave "${groupName}"? You'll need a new invite to rejoin.`))
      return;
    setError(null);
    setPendingAction("leave");
    try {
      await leaveGroup({ groupId });
      router.push("/groups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't leave group.");
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete "${groupName}"? This removes the group and all its members. This cannot be undone.`,
      )
    )
      return;
    setError(null);
    setPendingAction("delete");
    try {
      await deleteGroup({ groupId });
      router.push("/groups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete group.");
      setPendingAction(null);
    }
  }

  return (
    <div className="rounded-xl border border-negative/30 bg-negative/5 p-4">
      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-negative">
        Danger zone
      </h3>

      {error && (
        <div role="alert" className="mb-3 text-sm font-bold text-negative">
          {error}
        </div>
      )}

      {isOwner ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={pendingAction !== null}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-negative bg-surface text-md font-extrabold text-negative transition-colors hover:bg-negative/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative",
            pendingAction && "cursor-not-allowed opacity-60",
          )}
        >
          {pendingAction === "delete" && (
            <Loader2 size={16} className="animate-spin" />
          )}
          Delete this group
        </button>
      ) : (
        <button
          type="button"
          onClick={handleLeave}
          disabled={pendingAction !== null}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-negative bg-surface text-md font-extrabold text-negative transition-colors hover:bg-negative/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative",
            pendingAction && "cursor-not-allowed opacity-60",
          )}
        >
          {pendingAction === "leave" && (
            <Loader2 size={16} className="animate-spin" />
          )}
          Leave this group
        </button>
      )}

      {isOwner && (
        <p className="mt-2 text-sm text-text-muted">
          Owners can't leave — delete the group or transfer ownership (coming
          in the next release) first.
        </p>
      )}
    </div>
  );
}

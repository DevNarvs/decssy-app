"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { UserMinus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Member {
  userId: Id<"users">;
  name: string;
  email: string;
  joinedAt: number;
  isOwner: boolean;
  isYou: boolean;
}

interface Props {
  members: Member[];
  groupColor: string;
  /** The group, needed to call removeMember. */
  groupId?: Id<"groups">;
  /** True if the viewer is the owner — shows remove buttons for other members. */
  canManage?: boolean;
}

export function MemberList({ members, groupColor, groupId, canManage }: Props) {
  const removeMember = useMutation(api.groups.removeMember);
  const [pending, setPending] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  async function confirmRemove() {
    if (!pending || !groupId) return;
    setRemoving(true);
    try {
      await removeMember({ groupId, userId: pending.userId });
      setPending(null);
    } catch (err) {
      console.warn("removeMember failed:", err);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-md font-extrabold text-white"
              style={{ backgroundColor: groupColor }}
              aria-hidden="true"
            >
              {m.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-md font-bold text-text">
                {m.name}
                {m.isYou && (
                  <span className="ml-1.5 text-sm font-normal text-text-muted">
                    (you)
                  </span>
                )}
              </div>
              <div className="truncate text-sm text-text-muted">{m.email}</div>
            </div>
            {m.isOwner ? (
              <span className="rounded-sm bg-accent-soft px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-accent">
                Owner
              </span>
            ) : (
              canManage &&
              groupId && (
                <button
                  type="button"
                  onClick={() => setPending(m)}
                  aria-label={`Remove ${m.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-negative/40 hover:bg-negative/10 hover:text-negative"
                >
                  <UserMinus size={16} strokeWidth={1.5} />
                </button>
              )
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => !removing && setPending(null)}
        onConfirm={confirmRemove}
        title={pending ? `Remove ${pending.name}?` : "Remove member?"}
        description="They'll lose access to this group and its events. Events and comments they already created stay. You can re-invite them anytime."
        confirmLabel="Remove"
        variant="danger"
        isProcessing={removing}
      />
    </>
  );
}

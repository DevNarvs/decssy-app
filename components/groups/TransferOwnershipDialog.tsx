"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Member {
  userId: Id<"users">;
  name: string;
  email: string;
  isOwner: boolean;
}

interface Props {
  groupId: Id<"groups">;
  groupName: string;
  members: Member[];
  open: boolean;
  onClose: () => void;
  onTransferred?: () => void;
}

export function TransferOwnershipDialog({
  groupId,
  groupName,
  members,
  open,
  onClose,
  onTransferred,
}: Props) {
  const transfer = useMutation(api.groups.transferOwnership);
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const otherMembers = members.filter((m) => !m.isOwner);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setError(null);
      return;
    }
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isProcessing) onClose();
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, isProcessing]);

  async function handleTransfer() {
    if (!selectedId) {
      setError("Pick a member to transfer to.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      await transfer({ groupId, newOwnerId: selectedId });
      onTransferred?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed.");
      setIsProcessing(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-dialog-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={isProcessing ? undefined : onClose}
        disabled={isProcessing}
        className="fixed inset-0 cursor-default bg-text/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-xl bg-surface p-6 shadow-md">
        <h2
          id="transfer-dialog-title"
          className="mb-2 text-lg font-extrabold tracking-tight text-text"
        >
          Transfer ownership
        </h2>
        <p className="mb-4 text-md text-text-muted">
          Pick the new owner of "{groupName}". You'll become a regular member.
        </p>

        {otherMembers.length === 0 ? (
          <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-text-muted">
            You're the only member. Invite someone first.
          </p>
        ) : (
          <ul className="mb-4 max-h-60 space-y-1 overflow-y-auto">
            {otherMembers.map((m) => (
              <li key={m.userId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(m.userId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border-2 px-3 py-2 text-left transition-colors",
                    selectedId === m.userId
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface hover:bg-surface-2",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-md font-bold text-text">
                      {m.name}
                    </div>
                    <div className="truncate text-sm text-text-muted">
                      {m.email}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleTransfer}
            disabled={
              isProcessing || otherMembers.length === 0 || selectedId === null
            }
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            Transfer ownership
          </button>
          <button
            type="button"
            ref={cancelRef}
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

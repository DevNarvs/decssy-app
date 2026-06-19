"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * Irreversible self-service account deletion. Calls the cascade mutation,
 * then signs out and returns to /sign-in. Groups the user owns with other
 * members are transferred (not destroyed); everything else of theirs is
 * removed.
 */
export function DeleteAccountSection() {
  const router = useRouter();
  const deleteAccount = useMutation(api.account.deleteAccount);
  const { signOut } = useAuthActions();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount({});
      await signOut().catch(() => {});
      router.replace("/sign-in");
    } catch (err) {
      console.warn("Account deletion failed:", err);
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <section className="rounded-xl border border-negative/30 bg-negative/5 p-4">
      <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-negative">
        Delete account
      </h2>
      <p className="mb-3 text-sm text-text-muted">
        Permanently delete your account and data. Groups you own with other
        members are handed to the longest-standing member; everything else of
        yours is removed. This can't be undone.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-negative bg-surface text-md font-extrabold text-negative transition-colors hover:bg-negative/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative focus-visible:ring-offset-2"
      >
        <Trash2 size={16} strokeWidth={1.5} />
        Delete my account
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => !deleting && setOpen(false)}
        onConfirm={handleDelete}
        title="Delete your account?"
        description="This permanently deletes your account, your personal events, your RSVPs, and your comments. Groups you own with other members will be transferred to them. This cannot be undone."
        confirmLabel="Delete forever"
        variant="danger"
        isProcessing={deleting}
      />
    </section>
  );
}

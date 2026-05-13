"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { InviteShareCard } from "@/components/groups/InviteShareCard";
import { ActiveInvitesList } from "@/components/groups/ActiveInvitesList";
import { getShareBaseUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupInvitePage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const router = useRouter();
  const detail = useQuery(api.groups.getGroup, { groupId });
  const invites = useQuery(api.invites.listGroupInvites, { groupId });
  const createInvite = useMutation(api.invites.createInvite);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInviteId, setCurrentInviteId] = useState<Id<"groupInvites"> | null>(
    null,
  );

  // Personal-default groups ("My Schedule") can't have invites — bounce away
  // before the auto-create useEffect fires. router.replace (soft nav) avoids
  // Chrome's "Blocked beforeunload" intervention that window.location triggers.
  const isPersonalDefault = detail?.group.isPersonalDefault === true;
  useEffect(() => {
    if (isPersonalDefault) {
      router.replace(`/groups/${groupId}`);
    }
  }, [isPersonalDefault, groupId, router]);

  // Non-member or non-owner — bounce to /groups via soft nav rather than
  // full-page reload (no beforeunload intervention).
  const isInaccessible = detail === null || invites === null;
  useEffect(() => {
    if (isInaccessible) {
      router.replace("/groups");
    }
  }, [isInaccessible, router]);

  // Auto-create an invite on first load if none exist; otherwise pick the most
  // recent one as the display target. The "Generate new" button creates a fresh
  // one and re-targets to it.
  useEffect(() => {
    if (invites === undefined || invites === null) return;
    if (isPersonalDefault) return; // redirecting; don't create
    if (invites.length === 0 && !isCreating) {
      setIsCreating(true);
      setError(null);
      createInvite({ groupId })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Couldn't create invite.");
        })
        .finally(() => {
          setIsCreating(false);
        });
    } else if (invites.length > 0 && currentInviteId === null) {
      const first = invites[0];
      if (first) setCurrentInviteId(first._id);
    }
  }, [invites, currentInviteId, createInvite, groupId, isCreating, isPersonalDefault]);

  if (detail === undefined || invites === undefined) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe">
        <div className="my-8 h-64 animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }

  // getGroup returns null if not a member; listGroupInvites returns null if
  // not the owner. Either means we shouldn't be here — the useEffect above
  // is already redirecting via router.replace; render nothing this frame.
  if (detail === null || invites === null) return null;

  // Use the current origin: dev → localhost, prod → vercel.app. Override
  // by setting NEXT_PUBLIC_APP_URL in .env.local when you need to test the
  // receive flow with a different origin.
  const baseUrl = getShareBaseUrl();

  const displayInvite: Doc<"groupInvites"> | undefined =
    invites.find((i) => i._id === currentInviteId) ?? invites[0];

  const otherInvites = displayInvite
    ? invites.filter((i) => i._id !== displayInvite._id)
    : [];

  async function handleRegenerate() {
    setError(null);
    setIsCreating(true);
    try {
      const newId = await createInvite({ groupId });
      setCurrentInviteId(newId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't regenerate.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link
          href={`/groups/${groupId}`}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-text">
          Invite
        </h1>
      </header>

      <div className="space-y-6">
        <p className="text-md text-text-muted">
          Share this with friends to add them to{" "}
          <span className="font-bold text-text">{detail.group.name}</span>.
          Anyone with the link can join until you revoke it.
        </p>

        {displayInvite ? (
          <InviteShareCard token={displayInvite.token} baseUrl={baseUrl} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-surface">
            {isCreating ? (
              <Loader2 size={24} className="animate-spin text-accent" />
            ) : (
              <span className="text-sm text-text-muted">No active invite.</span>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isCreating}
          className={cn(
            "flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-bold text-text-muted",
            "transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isCreating && "cursor-not-allowed opacity-60",
          )}
        >
          {isCreating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} strokeWidth={1.5} />
          )}
          Generate new invite
        </button>

        {otherInvites.length > 0 && (
          <section>
            <h3 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
              Other active invites ({otherInvites.length})
            </h3>
            <ActiveInvitesList
              invites={otherInvites}
              groupName={detail.group.name}
            />
          </section>
        )}
      </div>
    </div>
  );
}

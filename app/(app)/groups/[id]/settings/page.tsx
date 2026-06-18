"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft, UserCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GroupSettingsForm } from "@/components/groups/GroupSettingsForm";
import { GroupNotificationToggle } from "@/components/groups/GroupNotificationToggle";
import { DangerZone } from "@/components/groups/DangerZone";
import { TransferOwnershipDialog } from "@/components/groups/TransferOwnershipDialog";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupSettingsPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const detail = useQuery(api.groups.getGroup, { groupId });
  const [transferOpen, setTransferOpen] = useState(false);

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe">
        <div className="space-y-3 py-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-md bg-surface-2"
            />
          ))}
        </div>
      </div>
    );
  }

  if (detail === null) {
    return null;
  }

  const canTransfer = detail.isOwner && detail.members.length > 1;

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
          Settings
        </h1>
      </header>

      <div className="space-y-6">
        {detail.isOwner ? (
          <GroupSettingsForm group={detail.group} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 text-md text-text-muted">
            Only the group owner can edit settings.
          </div>
        )}

        {/* Per-group mute — available to every member. Pointless for the
            solo "Just me" group (you never get notified about your own
            events), so hide it there. */}
        {!detail.group.isPersonalDefault && (
          <GroupNotificationToggle groupId={groupId} />
        )}

        {canTransfer && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-text-muted">
              Ownership
            </h3>
            <p className="mb-3 text-sm text-text-muted">
              Hand over this group to another member. You'll stay in the group
              as a regular member.
            </p>
            <button
              type="button"
              onClick={() => setTransferOpen(true)}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-md font-bold text-text transition-colors hover:bg-surface-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              )}
            >
              <UserCheck size={16} strokeWidth={1.5} />
              Transfer ownership
            </button>
          </div>
        )}

        <DangerZone
          groupId={groupId}
          isOwner={detail.isOwner}
          groupName={detail.group.name}
        />
      </div>

      <TransferOwnershipDialog
        groupId={groupId}
        groupName={detail.group.name}
        members={detail.members}
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
      />
    </div>
  );
}

"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GroupSettingsForm } from "@/components/groups/GroupSettingsForm";
import { DangerZone } from "@/components/groups/DangerZone";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupSettingsPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const detail = useQuery(api.groups.getGroup, { groupId });

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

        <DangerZone
          groupId={groupId}
          isOwner={detail.isOwner}
          groupName={detail.group.name}
        />
      </div>
    </div>
  );
}

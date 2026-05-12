"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft, Settings } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GroupHero } from "@/components/groups/GroupHero";
import { MemberList } from "@/components/groups/MemberList";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const detail = useQuery(api.groups.getGroup, { groupId });

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe">
        <div className="my-12 h-32 animate-pulse rounded-xl bg-surface-2" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-surface-2"
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
          href="/groups"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h2 className="flex-1 truncate text-lg font-extrabold tracking-tight text-text">
          {detail.group.name}
        </h2>
        <Link
          href={`/groups/${groupId}/settings`}
          aria-label="Group settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <Settings size={16} strokeWidth={1.5} />
        </Link>
      </header>

      <div className="space-y-6">
        <GroupHero
          group={detail.group}
          memberCount={detail.members.length}
          isOwner={detail.isOwner}
        />

        <section>
          <h3 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
            Members ({detail.members.length})
          </h3>
          <MemberList
            members={detail.members}
            groupColor={detail.group.color}
          />
        </section>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Plus, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { GroupCard } from "@/components/groups/GroupCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GroupsPage() {
  const groups = useQuery(api.groups.listMyGroups);

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Groups<span className="text-accent">.</span>
        </h1>
        <Link
          href="/groups/new"
          className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          <Plus size={14} strokeWidth={2.5} />
          New
        </Link>
      </header>

      {groups === undefined && (
        <div className="space-y-2 py-4" aria-busy="true">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-surface-2"
            />
          ))}
        </div>
      )}

      {groups && groups.length === 0 && (
        <EmptyState
          icon={<Users size={24} strokeWidth={1.5} />}
          title="No groups yet"
          description="Create your first group to start sharing calendars with friends or family."
          cta={{ label: "Create your first group", href: "/groups/new" }}
        />
      )}

      {groups && groups.length > 0 && (
        <ul className="space-y-2 pb-12">
          {groups.map(({ group, memberCount, isOwner }) => (
            <li key={group._id}>
              <GroupCard
                group={group}
                memberCount={memberCount}
                isOwner={isOwner}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  FindFreeForm,
  type FindFreeFormValues,
} from "@/components/find/FindFreeForm";
import { FreeSlotCard } from "@/components/find/FreeSlotCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FindPage() {
  const myGroups = useQuery(api.groups.listMyGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(
    null,
  );
  // groupDetail provides members for the currently-selected group.
  const groupDetail = useQuery(
    api.groups.getGroup,
    selectedGroupId ? { groupId: selectedGroupId } : "skip",
  );

  const [search, setSearch] = useState<FindFreeFormValues | null>(null);
  const results = useQuery(
    api.findfree.findFreeSlots,
    search ? search : "skip",
  );

  const isSearching = search !== null && results === undefined;

  const members = useMemo(() => {
    if (!groupDetail) return undefined;
    return groupDetail.members.map((m) => ({
      userId: m.userId,
      name: m.isYou ? `${m.name} (you)` : m.name,
    }));
  }, [groupDetail]);

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="py-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Find a free day<span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Pick a group, a window, and a duration. We'll find times everyone's
          free.
        </p>
      </header>

      {myGroups === undefined && (
        <div className="my-8 h-64 animate-pulse rounded-xl bg-surface-2" />
      )}

      {myGroups && myGroups.length === 0 && (
        <EmptyState
          icon={<Search size={20} strokeWidth={1.5} />}
          title="No groups yet"
          description="Create a group first to find free times across its members."
          cta={{ label: "Create a group", href: "/groups/new" }}
          className="my-8"
        />
      )}

      {myGroups && myGroups.length > 0 && (
        <FindFreeForm
          groups={myGroups.map((g) => g.group)}
          members={members}
          onSelectGroup={setSelectedGroupId}
          onSubmit={setSearch}
          isSearching={isSearching}
        />
      )}

      {search && results !== undefined && results !== null && (
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
            Results ({results.length})
          </h2>
          {results.length === 0 ? (
            <EmptyState
              icon={<Search size={20} strokeWidth={1.5} />}
              title="No free slots found"
              description="Try widening the date range, adding more time-of-day windows, or excluding members."
              className="py-8"
            />
          ) : (
            <ul className="space-y-2">
              {results.map((s, i) => (
                <li key={`${s.start}-${i}`}>
                  <FreeSlotCard slot={s} groupId={search.groupId} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

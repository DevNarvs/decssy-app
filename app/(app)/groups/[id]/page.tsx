"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Settings,
  Share2,
  Plus,
  CalendarDays,
  LockKeyhole,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GroupHero } from "@/components/groups/GroupHero";
import { MemberList } from "@/components/groups/MemberList";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = id as Id<"groups">;
  const detail = useQuery(api.groups.getGroup, { groupId });
  const upcoming = useQuery(api.events.listUpcomingEventsInGroup, {
    groupId,
    limit: 5,
  });

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

  if (detail === null) {
    // `getGroup` returns null in three cases: the group was deleted, the
    // signed-in user was removed, or the user was never a member (someone
    // shared the wrong URL — they pasted /groups/<id> instead of the
    // /join/<token> invite link).
    //
    // Previously we did a silent `window.location.href = "/groups"` which
    // (a) triggered Chrome's "beforeunload intervention" warning in
    // console, (b) gave the user zero context about what just happened.
    // Now we render an explicit empty state so they know how to recover.
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-12">
        <header className="flex items-center gap-3 py-4">
          <Link
            href="/groups"
            aria-label="Back to groups"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Link>
          <h2 className="flex-1 text-lg font-extrabold tracking-tight text-text">
            Group not available
          </h2>
        </header>
        <EmptyState
          icon={<LockKeyhole size={24} strokeWidth={1.5} />}
          title="You're not in this group"
          description={
            "Either this group was deleted, you were removed, or you opened a group URL without an invite. " +
            "If you have an invite link (looks like /join/…), open that instead — it'll add you to the group."
          }
          cta={{ label: "Back to my groups", href: "/groups" }}
          className="my-8"
        />
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
        <div className="space-y-2">
          <GroupHero
            group={detail.group}
            memberCount={detail.members.length}
            isOwner={detail.isOwner}
          />

          {detail.isOwner && !detail.group.isPersonalDefault && (
            <Link
              href={`/groups/${groupId}/invite`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Share2 size={16} strokeWidth={1.5} />
              Invite people
            </Link>
          )}
        </div>

        {/* Upcoming events */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-text-muted">
              Upcoming events
            </h3>
            <Link
              href={`/groups/${groupId}/events/new`}
              className="flex items-center gap-1 text-sm font-extrabold text-accent"
            >
              <Plus size={12} strokeWidth={2.5} />
              New
            </Link>
          </div>
          {upcoming === undefined && (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-surface-2"
                />
              ))}
            </div>
          )}
          {upcoming !== undefined && upcoming !== null && upcoming.length === 0 && (
            <EmptyState
              icon={<CalendarDays size={20} strokeWidth={1.5} />}
              title="No upcoming events"
              description="Add the first event to start coordinating."
              cta={{
                label: "Create an event",
                href: `/groups/${groupId}/events/new`,
              }}
              className="py-8"
            />
          )}
          {upcoming !== undefined && upcoming !== null && upcoming.length > 0 && (
            <ul className="space-y-2">
              {upcoming.map((e) => (
                <li key={e._id}>
                  <EventCard event={e} groupColor={detail.group.color} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
            Members ({detail.members.length})
          </h3>
          <MemberList
            members={detail.members}
            groupColor={detail.group.color}
            groupId={groupId}
            canManage={detail.isOwner}
          />
        </section>
      </div>
    </div>
  );
}

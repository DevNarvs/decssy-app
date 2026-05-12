"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, User, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EventTimeDisplay } from "@/components/events/EventTimeDisplay";
import { RsvpControl } from "@/components/events/RsvpControl";
import { AttendeesList } from "@/components/events/AttendeesList";
import { CommentThread } from "@/components/events/CommentThread";
import { RecurrenceBadge } from "@/components/events/RecurrenceBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string; eid: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { id, eid } = use(params);
  const groupId = id as Id<"groups">;
  const eventId = eid as Id<"events">;
  const router = useRouter();
  const detail = useQuery(api.events.getEvent, { eventId });
  // Also need group color for avatars; fetch lightweight group detail.
  const groupDetail = useQuery(api.groups.getGroup, { groupId });
  const cancelEvent = useMutation(api.events.cancelEvent);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (detail === undefined || groupDetail === undefined) {
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

  if (detail === null || groupDetail === null) {
    if (typeof window !== "undefined") {
      window.location.href = `/groups/${groupId}`;
    }
    return null;
  }

  const { event, attendees, comments, myStatus, isCreator } = detail;
  const TypeIcon = event.type === "group_shared" ? Users : User;

  async function handleCancelEvent() {
    setIsCancelling(true);
    try {
      router.push(`/groups/${groupId}`);
      await cancelEvent({ eventId });
    } catch (err) {
      setIsCancelling(false);
      console.warn("Cancel failed:", err);
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
        <h2 className="flex-1 truncate text-lg font-extrabold tracking-tight text-text">
          {event.title}
        </h2>
        {isCreator && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            aria-label="Cancel event"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-negative/40 bg-surface text-negative hover:bg-negative/10"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        )}
      </header>

      <div className="space-y-6">
        {/* Header card */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <TypeIcon
              size={12}
              strokeWidth={1.5}
              className="text-text-muted"
            />
            <span className="text-xs font-extrabold uppercase tracking-wide text-text-muted">
              {event.type === "group_shared" ? "Group event" : "Personal"}
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-text">
            {event.title}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            <EventTimeDisplay event={event} />
          </p>
          {event.recurrenceRule && (
            <div className="mt-2 inline-flex">
              <RecurrenceBadge
                rule={event.recurrenceRule}
                startDate={new Date(event.startUtc)}
              />
            </div>
          )}
          {event.description && (
            <p className="mt-3 whitespace-pre-wrap text-md text-text">
              {event.description}
            </p>
          )}
        </div>

        {/* RSVP — show for everyone except cancelled events */}
        <RsvpControl
          eventId={eventId}
          currentStatus={myStatus}
          eventType={event.type}
        />

        {/* Attendees */}
        <AttendeesList
          attendees={attendees}
          groupColor={groupDetail.group.color}
        />

        {/* Comments */}
        <CommentThread
          eventId={eventId}
          comments={comments}
          groupColor={groupDetail.group.color}
        />
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => !isCancelling && setConfirmCancel(false)}
        onConfirm={handleCancelEvent}
        title={`Cancel "${event.title}"?`}
        description="Attendees will see the event was cancelled. This can't be undone."
        confirmLabel="Yes, cancel event"
        variant="danger"
        isProcessing={isCancelling}
      />
    </div>
  );
}

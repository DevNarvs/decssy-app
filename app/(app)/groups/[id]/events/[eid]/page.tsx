"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  User,
  Users,
  Share2,
  MapPin,
  CalendarPlus,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EventTimeDisplay } from "@/components/events/EventTimeDisplay";
import { RsvpControl } from "@/components/events/RsvpControl";
import { AttendeesList } from "@/components/events/AttendeesList";
import { CommentThread } from "@/components/events/CommentThread";
import { RecurrenceBadge } from "@/components/events/RecurrenceBadge";
import { EventShareDialog } from "@/components/events/EventShareDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { downloadEventIcs } from "@/lib/ics";
import { cn } from "@/lib/utils";

/** Universal Google Maps search link — opens the native maps app on mobile. */
function mapsUrl(loc: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
}

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
  const [shareOpen, setShareOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Redirect ONLY when the event itself is inaccessible — deleted, or the
  // caller has neither group membership nor an event-share attendee row
  // (getEvent returns null). A null groupDetail alongside a non-null detail
  // means "guest": access via a per-event share, not group membership. That
  // is a valid view, NOT a reason to bounce.
  useEffect(() => {
    if (detail === null) router.replace("/calendar");
  }, [detail, router]);

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

  if (detail === null) {
    // useEffect above is redirecting to /calendar.
    return null;
  }

  // Guest = can see this event via a share, but isn't in its group. We have
  // no group color/name for them (getGroup is membership-gated and returned
  // null), so fall back to a neutral color and hide group-only affordances.
  const isGuest = groupDetail === null;
  // Narrow on groupDetail directly (not isGuest) so TS knows it's non-null.
  const groupColor = groupDetail === null ? "#9CA3AF" : groupDetail.group.color;

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
          href={isGuest ? "/calendar" : `/groups/${groupId}`}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h2 className="flex-1 truncate text-lg font-extrabold tracking-tight text-text">
          {event.title}
        </h2>
        {/* Add to calendar — anyone who can see the event can save it. */}
        <button
          type="button"
          onClick={() => downloadEventIcs(event)}
          aria-label="Add to calendar"
          title="Add to calendar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <CalendarPlus size={16} strokeWidth={1.5} />
        </button>
        {/* Guests can't re-share an event they don't own — hide the button. */}
        {!isGuest && (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share event"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <Share2 size={16} strokeWidth={1.5} />
          </button>
        )}
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
          {event.location && (
            <a
              href={mapsUrl(event.location)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-accent hover:text-accent/80"
            >
              <MapPin size={12} strokeWidth={1.5} />
              {event.location}
            </a>
          )}
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
        <AttendeesList attendees={attendees} groupColor={groupColor} />

        {/* Comments */}
        <CommentThread
          eventId={eventId}
          comments={comments}
          groupColor={groupColor}
        />
      </div>

      {/* Share dialog needs group context (owner/personal flags) — render
          only for members (groupDetail non-null), never guests. */}
      {groupDetail !== null && (
        <EventShareDialog
          groupId={groupId}
          eventId={eventId}
          eventTitle={event.title}
          isOwner={groupDetail.isOwner}
          isPersonalDefault={groupDetail.group.isPersonalDefault === true}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

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

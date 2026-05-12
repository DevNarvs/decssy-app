import Link from "next/link";
import { ChevronRight, Users, User } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { EventTimeDisplay } from "./EventTimeDisplay";

interface Props {
  event: Doc<"events">;
  groupColor: string;
}

export function EventCard({ event, groupColor }: Props) {
  const TypeIcon = event.type === "group_shared" ? Users : User;
  return (
    <Link
      href={`/groups/${event.groupId}/events/${event._id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div
        className="h-12 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: groupColor }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <TypeIcon size={12} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-xs font-bold uppercase tracking-wide text-text-muted">
            {event.type === "group_shared" ? "Group event" : "Personal"}
          </span>
        </div>
        <div className="truncate text-md font-extrabold text-text">
          {event.title}
        </div>
        <div className="truncate text-sm text-text-muted">
          <EventTimeDisplay event={event} short />
        </div>
      </div>
      <ChevronRight size={18} strokeWidth={1.5} className="text-text-muted" />
    </Link>
  );
}

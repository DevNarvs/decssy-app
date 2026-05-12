"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";

interface AgendaItem {
  event: Doc<"events">;
  groupColor: string;
  groupName: string;
}

interface Props {
  items: AgendaItem[];
  heading: string;
  emptyMessage: string;
}

export function AgendaList({ items, heading, emptyMessage }: Props) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
        {heading}
      </h3>

      {items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={20} strokeWidth={1.5} />}
          title="Nothing here"
          description={emptyMessage}
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {items.map(({ event, groupColor }) => (
            <li key={event._id}>
              <EventCard event={event} groupColor={groupColor} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

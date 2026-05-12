"use client";

import { RSVP_STATUSES, type RsvpStatus } from "@/convex/lib/enums";
import type { Id } from "@/convex/_generated/dataModel";

interface Attendee {
  userId: Id<"users">;
  name: string;
  status: string;
  isYou: boolean;
  isCreator: boolean;
}

export function AttendeesList({
  attendees,
  groupColor,
}: {
  attendees: Attendee[];
  groupColor: string;
}) {
  // Owner of event first, then attending, then maybe, then declined, then invited.
  const order: Record<string, number> = {
    attending: 1,
    maybe: 2,
    declined: 3,
    invited: 4,
  };
  const sorted = [...attendees].sort((a, b) => {
    if (a.isCreator !== b.isCreator) return a.isCreator ? -1 : 1;
    return (order[a.status] ?? 5) - (order[b.status] ?? 5);
  });

  const going = attendees.filter((a) => a.status === "attending").length;
  const maybe = attendees.filter((a) => a.status === "maybe").length;
  const declined = attendees.filter((a) => a.status === "declined").length;

  return (
    <div>
      <div className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
        Attendees ({going} going{maybe ? ` · ${maybe} maybe` : ""}
        {declined ? ` · ${declined} can't go` : ""})
      </div>
      <ul className="space-y-1">
        {sorted.map((a) => {
          const sc = RSVP_STATUSES[a.status as RsvpStatus]?.color ?? "#9CA3AF";
          const sl =
            RSVP_STATUSES[a.status as RsvpStatus]?.label ?? a.status;
          return (
            <li
              key={a.userId}
              className="flex items-center gap-3 rounded-md border border-border bg-surface p-2.5"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ backgroundColor: groupColor }}
                aria-hidden="true"
              >
                {a.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-md font-bold text-text">
                  {a.name}
                  {a.isYou && (
                    <span className="ml-1.5 text-sm font-normal text-text-muted">
                      (you)
                    </span>
                  )}
                  {a.isCreator && (
                    <span className="ml-1.5 inline-block rounded-sm bg-accent-soft px-1.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-accent">
                      Host
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: sc }}
                  aria-hidden="true"
                />
                <span className="text-sm text-text-muted">{sl}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

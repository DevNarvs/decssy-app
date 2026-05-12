"use client";

import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Slot {
  start: number;
  end: number;
  freeCount: number;
  totalCount: number;
  busyNames: string[];
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function FreeSlotCard({
  slot,
  groupId,
}: {
  slot: Slot;
  groupId: Id<"groups">;
}) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const isAllDay = end.getTime() - start.getTime() > 23 * 60 * 60 * 1000;
  const allFree = slot.freeCount === slot.totalCount;

  // Pre-fill the event create page using URL params (not yet wired — the
  // form would need to read these; for Plan 8 the link just navigates.)
  const createUrl = `/groups/${groupId}/events/new`;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-surface p-3 transition-colors",
        allFree ? "border-positive/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        {allFree ? (
          <Sparkles size={18} strokeWidth={1.5} className="mt-0.5 text-positive" />
        ) : (
          <div className="mt-1.5 h-2 w-2 rounded-full bg-text-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-md font-extrabold text-text">
            {dateFmt.format(start)}
            {!isAllDay && (
              <>
                {" "}
                · {timeFmt.format(start)}–{timeFmt.format(end)}
              </>
            )}
            {isAllDay && (
              <span className="ml-1 text-sm font-normal text-text-muted">
                (All day)
              </span>
            )}
          </div>
          <div className="text-sm text-text-muted">
            {allFree
              ? `All ${slot.totalCount} free`
              : `${slot.freeCount} of ${slot.totalCount} free · ${slot.busyNames.join(", ")} busy`}
          </div>
        </div>
      </div>
      <Link
        href={createUrl}
        className="flex h-9 items-center justify-center gap-1 self-end rounded-md border border-accent/40 bg-surface px-3 text-sm font-bold text-accent transition-colors hover:bg-accent-soft"
      >
        <Plus size={12} strokeWidth={2.5} />
        Create event
      </Link>
    </div>
  );
}

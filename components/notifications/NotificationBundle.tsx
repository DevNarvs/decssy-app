"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { MessageSquare } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

function relativeTime(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ms).toLocaleDateString();
}

/** "Alice", "Alice and Bob", "Alice, Bob & 2 others". */
function actorList(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  const others = names.length - 2;
  return `${names[0]}, ${names[1]} & ${others} other${others > 1 ? "s" : ""}`;
}

/**
 * Collapsed view of multiple comment notifications on the same event, so a
 * busy thread reads as one line ("Alice, Bob & 1 other commented · 4 new")
 * instead of N rows the user has to scroll past. Tapping opens the event and
 * marks every notification in the bundle read.
 *
 * `rows` must be non-empty, all comment_added on the same event, newest-first.
 */
export function NotificationBundle({ rows }: { rows: Doc<"notifications">[] }) {
  const markRead = useMutation(api.notifications.markRead);
  const latest = rows[0]!;
  const anyUnread = rows.some((r) => r.readAt === undefined);

  // Distinct actor names, newest-first.
  const actors: string[] = [];
  for (const r of rows) {
    if (!actors.includes(r.actorName)) actors.push(r.actorName);
  }

  const href = latest.eventId
    ? `/groups/${latest.groupId}/events/${latest.eventId}`
    : latest.groupId
      ? `/groups/${latest.groupId}`
      : "/";

  function handleClick() {
    for (const r of rows) {
      if (r.readAt === undefined) {
        markRead({ id: r._id as Id<"notifications"> }).catch(() => {});
      }
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        anyUnread
          ? "border-accent/40 bg-accent-soft hover:bg-accent-soft/80"
          : "border-border bg-surface hover:bg-surface-2",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          anyUnread ? "bg-accent text-white" : "bg-surface-2 text-text-muted",
        )}
      >
        <MessageSquare size={16} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-md leading-snug",
            anyUnread ? "font-bold text-text" : "text-text-muted",
          )}
        >
          {actorList(actors)} commented
        </p>
        <p className="mt-0.5 text-sm text-text-muted">
          {rows.length} new comments · {relativeTime(latest.createdAt)}
        </p>
      </div>
      {anyUnread && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
          aria-label="Unread"
        />
      )}
    </Link>
  );
}

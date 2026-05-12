"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { Check, MessageSquare, UserPlus, Edit3, X, Crown } from "lucide-react";
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

function iconFor(type: string) {
  switch (type) {
    case "event_invite":
      return Check;
    case "event_updated":
      return Edit3;
    case "event_cancelled":
      return X;
    case "comment_added":
      return MessageSquare;
    case "invite_accepted":
      return UserPlus;
    case "ownership_transferred":
      return Crown;
    default:
      return Check;
  }
}

export function NotificationItem({ n }: { n: Doc<"notifications"> }) {
  const markRead = useMutation(api.notifications.markRead);
  const Icon = iconFor(n.type);
  const isUnread = n.readAt === undefined;

  const href = n.eventId
    ? `/groups/${n.groupId}/events/${n.eventId}`
    : n.groupId
      ? `/groups/${n.groupId}`
      : "/";

  function handleClick() {
    if (isUnread) {
      markRead({ id: n._id as Id<"notifications"> }).catch(() => {});
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        isUnread
          ? "border-accent/40 bg-accent-soft hover:bg-accent-soft/80"
          : "border-border bg-surface hover:bg-surface-2",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          isUnread ? "bg-accent text-white" : "bg-surface-2 text-text-muted",
        )}
      >
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-md leading-snug",
            isUnread ? "font-bold text-text" : "text-text-muted",
          )}
        >
          {n.message}
        </p>
        <p className="mt-0.5 text-sm text-text-muted">
          {relativeTime(n.createdAt)}
        </p>
      </div>
      {isUnread && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
          aria-label="Unread"
        />
      )}
    </Link>
  );
}

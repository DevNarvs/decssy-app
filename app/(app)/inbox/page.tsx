"use client";

import { useMutation, useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationBundle } from "@/components/notifications/NotificationBundle";
import { EmptyState } from "@/components/ui/EmptyState";

const DAY_MS = 24 * 60 * 60 * 1000;

type Notif = Doc<"notifications">;

/**
 * Collapse comment notifications on the same event into one bundle so a busy
 * thread reads as a single row instead of N. Everything else stays a single
 * row. Input is newest-first; output preserves that order by each group's
 * newest item.
 */
function bundleNotifications(items: Notif[]): Array<{ key: string; rows: Notif[] }> {
  const groups = new Map<string, Notif[]>();
  const order: string[] = [];
  for (const n of items) {
    const key =
      n.type === "comment_added" && n.eventId
        ? `c:${n.eventId}`
        : `s:${n._id}`; // singletons never merge
    const existing = groups.get(key);
    if (existing) {
      existing.push(n);
    } else {
      groups.set(key, [n]);
      order.push(key);
    }
  }
  return order.map((key) => ({ key, rows: groups.get(key)! }));
}

export default function InboxPage() {
  const notifications = useQuery(api.notifications.listMyNotifications);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const isLoading = notifications === undefined;
  const isEmpty = notifications !== undefined && notifications !== null && notifications.length === 0;

  // Group by Today / Yesterday / Earlier.
  const now = Date.now();
  const today = notifications?.filter((n) => now - n.createdAt < DAY_MS) ?? [];
  const yesterday =
    notifications?.filter(
      (n) => now - n.createdAt >= DAY_MS && now - n.createdAt < 2 * DAY_MS,
    ) ?? [];
  const earlier =
    notifications?.filter((n) => now - n.createdAt >= 2 * DAY_MS) ?? [];

  const hasUnread = notifications?.some((n) => n.readAt === undefined) ?? false;

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center justify-between py-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Inbox<span className="text-accent">.</span>
        </h1>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllRead({})}
            className="text-sm font-bold text-accent hover:text-accent/80"
          >
            Mark all read
          </button>
        )}
      </header>

      {isLoading && (
        <div className="space-y-2 py-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-surface-2"
            />
          ))}
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon={<Bell size={20} strokeWidth={1.5} />}
          title="All caught up"
          description="Nothing new. We'll let you know when something happens in your groups."
          className="my-8"
        />
      )}

      {notifications && notifications.length > 0 && (
        <div className="space-y-6 pb-12">
          {today.length > 0 && (
            <Section title="Today" items={today} />
          )}
          {yesterday.length > 0 && (
            <Section title="Yesterday" items={yesterday} />
          )}
          {earlier.length > 0 && (
            <Section title="Earlier" items={earlier} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: Notif[] }) {
  const groups = bundleNotifications(items);
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      <ul className="space-y-2">
        {groups.map(({ key, rows }) => (
          <li key={key}>
            {rows.length > 1 ? (
              <NotificationBundle rows={rows} />
            ) : (
              <NotificationItem n={rows[0]!} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

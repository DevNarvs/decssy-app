"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Settings } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  getPendingInvite,
} from "@/lib/hooks/usePendingInvite";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { GroupFilterChips } from "@/components/calendar/GroupFilterChips";
import { MonthGrid, localDateKey } from "@/components/calendar/MonthGrid";
import { AgendaList } from "@/components/calendar/AgendaList";
import { CreateEventFAB } from "@/components/calendar/CreateEventFAB";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";
// `Link` from next/link is imported above; we use it for the settings cog.

export default function CalendarPage() {
  const router = useRouter();

  // 1) Pending-invite redirect (from Plan 3). Runs once on mount.
  useEffect(() => {
    const token = getPendingInvite();
    if (token) {
      router.replace(`/join/${token}/accept`);
    }
  }, [router]);

  // 2) Current visible month + selected date (both default to today).
  const [today] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);

  // 3) Filter state — empty Set means "show all".
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(),
  );

  // 4) Query data.
  const myGroups = useQuery(api.groups.listMyGroups);

  // Range: 1st of month minus 6 days (to cover prior month overflow in grid)
  // through end of month plus 6 days (next month overflow).
  const rangeStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1 - 6,
  ).getTime();
  const rangeEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    6,
    23,
    59,
    59,
    999,
  ).getTime();

  const filterIds = useMemo(() => {
    if (selectedGroupIds.size === 0) return undefined;
    return Array.from(selectedGroupIds) as Id<"groups">[];
  }, [selectedGroupIds]);

  const events = useQuery(api.events.listMyEventsInRange, {
    rangeStart,
    rangeEnd,
    groupIds: filterIds,
  });

  // 5) Aggregate events into a map per local date.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!events) return map;
    for (const { event, groupColor } of events) {
      const key = localDateKey(new Date(event.startUtc));
      const existing = map.get(key);
      if (existing) existing.push(groupColor);
      else map.set(key, [groupColor]);
    }
    return map;
  }, [events]);

  // 6) Agenda for selected date — events whose start falls on the selected day
  // (multi-day events show on their start date; PRD wireframe behaviour).
  const selectedKey = localDateKey(selectedDate);
  const selectedDateAgenda = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (e) => localDateKey(new Date(e.event.startUtc)) === selectedKey,
    );
  }, [events, selectedKey]);

  // 7) Month navigation.
  function goPrev() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  }
  function goNext() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  }
  function goToday() {
    const t = new Date();
    setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDate(t);
  }

  function toggleGroup(gid: Id<"groups">) {
    const key = gid.toString();
    const next = new Set(selectedGroupIds);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedGroupIds(next);
  }

  // 8) Loading states + empty-onboarding state.
  const isLoadingGroups = myGroups === undefined;
  const isLoadingEvents = events === undefined;

  const hasNoGroups = myGroups !== undefined && myGroups.length === 0;

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center justify-between py-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Decssy<span className="text-accent">.</span>
        </h1>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <Settings size={16} strokeWidth={1.5} />
        </Link>
      </header>

      {/* Group filter chips */}
      {isLoadingGroups ? (
        <div className="my-2 h-8 animate-pulse rounded-full bg-surface-2" />
      ) : myGroups && myGroups.length > 0 ? (
        <div className="mb-2">
          <GroupFilterChips
            groups={myGroups.map((g) => g.group)}
            selectedIds={selectedGroupIds}
            onToggle={toggleGroup}
          />
        </div>
      ) : null}

      {/* Month nav */}
      <CalendarHeader
        year={currentMonth.getFullYear()}
        month={currentMonth.getMonth()}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />

      {/* Month grid */}
      {hasNoGroups ? (
        <EmptyState
          icon={<CalendarDays size={24} strokeWidth={1.5} />}
          title="No calendar yet"
          description="Create your first group to start adding events."
          cta={{ label: "Create a group", href: "/groups/new" }}
          className="my-8"
        />
      ) : (
        <>
          <MonthGrid
            year={currentMonth.getFullYear()}
            month={currentMonth.getMonth()}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            eventsByDay={eventsByDay}
          />

          {/* Selected-date agenda */}
          <div className="mt-6">
            <AgendaList
              items={selectedDateAgenda}
              heading={dateFmt.format(selectedDate)}
              emptyMessage={
                isLoadingEvents
                  ? "Loading events…"
                  : "No events on this day. Tap + to add one."
              }
            />
          </div>
        </>
      )}

      {/* FAB — render when groups are loaded */}
      {myGroups !== undefined && (
        <CreateEventFAB groups={myGroups.map((g) => g.group)} />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type TimeOfDay = "morning" | "afternoon" | "evening";

const TOD_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning (8am–12pm)",
  afternoon: "Afternoon (12–5pm)",
  evening: "Evening (5–10pm)",
};

const DURATION_OPTIONS = [
  { value: 0, label: "All day" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
];

interface Member {
  userId: Id<"users">;
  name: string;
}

export interface FindFreeFormValues {
  groupId: Id<"groups">;
  rangeStart: number;
  rangeEnd: number;
  durationMinutes: number;
  timeOfDayFilters: TimeOfDay[];
  includeUserIds: Id<"users">[];
}

interface Props {
  groups: Doc<"groups">[];
  /** Members of the currently-selected group; undefined while loading. */
  members?: Member[];
  onSelectGroup: (groupId: Id<"groups"> | null) => void;
  onSubmit: (values: FindFreeFormValues) => void;
  isSearching: boolean;
}

function toDateInput(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function FindFreeForm({
  groups,
  members,
  onSelectGroup,
  onSubmit,
  isSearching,
}: Props) {
  const [groupId, setGroupId] = useState<Id<"groups"> | null>(
    (groups[0]?._id as Id<"groups"> | undefined) ?? null,
  );
  useEffect(() => {
    onSelectGroup(groupId);
  }, [groupId, onSelectGroup]);

  const today = new Date();
  const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(toDateInput(today));
  const [endDate, setEndDate] = useState(toDateInput(twoWeeks));

  const [duration, setDuration] = useState(60);
  const [tod, setTod] = useState<Set<TimeOfDay>>(
    new Set(["afternoon", "evening"]),
  );
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  function toggleTod(t: TimeOfDay) {
    const next = new Set(tod);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setTod(next);
  }
  function toggleMember(uid: Id<"users">) {
    const key = uid.toString();
    const next = new Set(excluded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExcluded(next);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!groupId) return;
    if (!members) return;

    const rangeStart = new Date(startDate + "T00:00:00").getTime();
    const rangeEnd =
      new Date(endDate + "T00:00:00").getTime() + 24 * 60 * 60 * 1000 - 1;

    onSubmit({
      groupId,
      rangeStart,
      rangeEnd,
      durationMinutes: duration,
      timeOfDayFilters: duration === 0 ? [] : Array.from(tod),
      includeUserIds: members
        .filter((m) => !excluded.has(m.userId.toString()))
        .map((m) => m.userId),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-text-muted">Group</label>
        <select
          value={groupId?.toString() ?? ""}
          onChange={(e) =>
            setGroupId((e.target.value as Id<"groups">) || null)
          }
          disabled={isSearching}
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {groups.length === 0 && <option value="">No groups yet</option>}
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-text-muted">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isSearching}
            className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-text-muted">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isSearching}
            className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-text-muted">Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          disabled={isSearching}
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {DURATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {duration !== 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-text-muted">Time of day</span>
          <div className="flex flex-col gap-1">
            {(Object.keys(TOD_LABELS) as TimeOfDay[]).map((t) => (
              <label
                key={t}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-md text-text hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={tod.has(t)}
                  onChange={() => toggleTod(t)}
                  disabled={isSearching}
                  className="h-5 w-5 accent-accent"
                />
                {TOD_LABELS[t]}
              </label>
            ))}
          </div>
        </div>
      )}

      {members && members.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-text-muted">
            Include people ({members.length - excluded.size} of {members.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => {
              const isIncluded = !excluded.has(m.userId.toString());
              return (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => toggleMember(m.userId)}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors",
                    isIncluded
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-surface text-text-muted",
                  )}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSearching || !groupId || !members}
        className={cn(
          "mt-2 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isSearching ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Search size={16} strokeWidth={1.5} />
        )}
        Find times
      </button>
    </form>
  );
}

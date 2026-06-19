"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { EventType } from "@/convex/lib/enums";
import { EventTypeSelector } from "./EventTypeSelector";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { cn } from "@/lib/utils";

interface Props {
  groupId: Id<"groups">;
}

function toLocalInputValue(d: Date): string {
  // YYYY-MM-DDTHH:MM in *local* time, suitable for <input type="datetime-local">.
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function EventCreateForm({ groupId }: Props) {
  const router = useRouter();
  const createEvent = useMutation(api.events.createEvent);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Defaults: today's date, next hour for start, +1hr for end.
  const now = new Date();
  const defaultStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours() + 1,
    0,
    0,
  );
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const [type, setType] = useState<EventType>("personal_shared");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startLocal, setStartLocal] = useState(toLocalInputValue(defaultStart));
  const [endLocal, setEndLocal] = useState(toLocalInputValue(defaultEnd));
  const [allDayDate, setAllDayDate] = useState(toDateInputValue(defaultStart));
  const [recurrenceRule, setRecurrenceRule] = useState<string | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 1) {
      setError("Please give the event a title.");
      return;
    }

    let startUtc: number;
    let endUtc: number;
    if (isAllDay) {
      // Treat the date as start-of-day in the event's tz; end at 23:59:59.999.
      // Simplified: parse as local date midnight; small DST edge but fine for MVP.
      const d = new Date(allDayDate + "T00:00:00");
      startUtc = d.getTime();
      endUtc = startUtc + (24 * 60 * 60 * 1000 - 1);
    } else {
      startUtc = new Date(startLocal).getTime();
      endUtc = new Date(endLocal).getTime();
      if (endUtc <= startUtc) {
        setError("End time must be after start time.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const eventId = await createEvent({
        groupId,
        type,
        title: title.trim(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        isAllDay,
        startUtc,
        endUtc,
        eventTimezone: tz,
        recurrenceRule,
      });
      router.push(`/groups/${groupId}/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create event.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-text-muted">Type</span>
        <EventTypeSelector
          value={type}
          onChange={setType}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-bold text-text-muted">
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          autoFocus
          placeholder="Movie night"
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="location" className="text-sm font-bold text-text-muted">
          Location{" "}
          <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="location"
          type="text"
          maxLength={200}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isSubmitting}
          placeholder="Where? e.g. Cafe Lola, 12 Main St"
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
        <label htmlFor="all-day" className="text-md font-bold text-text">
          All day
        </label>
        <input
          id="all-day"
          type="checkbox"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          disabled={isSubmitting}
          className="h-5 w-5 accent-accent"
        />
      </div>

      {isAllDay ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-bold text-text-muted">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={allDayDate}
            onChange={(e) => setAllDayDate(e.target.value)}
            disabled={isSubmitting}
            className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="start"
              className="text-sm font-bold text-text-muted"
            >
              Starts
            </label>
            <input
              id="start"
              type="datetime-local"
              required
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              disabled={isSubmitting}
              className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="end" className="text-sm font-bold text-text-muted">
              Ends
            </label>
            <input
              id="end"
              type="datetime-local"
              required
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              disabled={isSubmitting}
              className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            />
          </div>
        </>
      )}

      <RecurrenceSelector
        value={recurrenceRule}
        onChange={setRecurrenceRule}
        disabled={isSubmitting}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-bold text-text-muted"
        >
          Description{" "}
          <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="rounded-md border border-border bg-surface px-3 py-2 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-2 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Create event
      </button>
    </form>
  );
}

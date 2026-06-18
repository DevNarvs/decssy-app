"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { CalendarClock } from "lucide-react";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";

interface Preview {
  eventTitle: string;
  startUtc: number;
  endUtc: number;
  isAllDay: boolean;
  eventTimezone: string;
  sharerName: string;
}

interface Props {
  token: string;
  preview: Preview | null;
}

/** Format an event's start in its own timezone for the preview card. */
function formatWhen(preview: Preview): string {
  const opts: Intl.DateTimeFormatOptions = preview.isAllDay
    ? { weekday: "short", month: "short", day: "numeric", timeZone: preview.eventTimezone }
    : {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: preview.eventTimezone,
      };
  try {
    return new Intl.DateTimeFormat("en-US", opts).format(new Date(preview.startUtc));
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: undefined }).format(
      new Date(preview.startUtc),
    );
  }
}

export function EventShareLandingClient({ token, preview }: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const respondPath = `/e/${token}/respond`;

  // Authenticated already → skip the preview, go straight to accept + RSVP.
  useEffect(() => {
    if (!isLoading && isAuthenticated && preview) {
      router.replace(respondPath);
    }
  }, [isLoading, isAuthenticated, preview, router, respondPath]);

  if (!preview) {
    return (
      <WelcomeCard
        title="Link not valid."
        subtitle="This event share link has expired or been revoked. Ask the person who shared it for a new one."
      >
        <Link
          href="/sign-in"
          className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          Sign in to Decssy
        </Link>
      </WelcomeCard>
    );
  }

  return (
    <WelcomeCard
      title="You're invited."
      subtitle={`${preview.sharerName} shared an event with you.`}
    >
      <div className="my-2 flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
          <CalendarClock size={22} strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-md font-extrabold text-text">
            {preview.eventTitle}
          </div>
          <div className="truncate text-sm text-text-muted">
            {formatWhen(preview)}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-text-muted">
        RSVP and it'll appear on your calendar. You won't join any group —
        just this one event.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={`/sign-up?next=${encodeURIComponent(respondPath)}`}
          className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          Sign up & RSVP
        </Link>
        <Link
          href={`/sign-in?next=${encodeURIComponent(respondPath)}`}
          className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted transition-colors hover:bg-surface-2"
        >
          Sign in instead
        </Link>
      </div>
    </WelcomeCard>
  );
}

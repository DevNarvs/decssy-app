"use client";

/**
 * Event-share accept landing. Auth-gated by middleware (mirrors
 * /join/[token]/accept). Runs acceptEventShare on mount, then shows the
 * outcome with a button into the event detail page (where the RSVP control
 * lives). We don't auto-redirect — a visible confirmation makes the flow
 * legible instead of feeling like a silent bounce.
 */
import { use, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, CalendarCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface AcceptResult {
  eventId: Id<"events">;
  groupId: Id<"groups">;
  eventTitle: string;
  sharerName: string;
  wasAlready: boolean;
  isCreator: boolean;
}

export default function RespondEventSharePage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const acceptEventShare = useMutation(api.eventShares.acceptEventShare);
  const [result, setResult] = useState<AcceptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    acceptEventShare({ token })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't add this event.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, acceptEventShare]);

  // Loading
  if (!result && !error) {
    return (
      <WelcomeCard title="Adding event…" subtitle="One moment.">
        <div className="my-8 flex justify-center">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      </WelcomeCard>
    );
  }

  // Error
  if (error) {
    return (
      <WelcomeCard
        title="Couldn't add it."
        subtitle="There was an issue with this share link."
      >
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
        >
          <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/calendar")}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white hover:bg-accent/90"
        >
          Go to calendar
        </button>
      </WelcomeCard>
    );
  }

  const r = result!;
  const eventHref = `/groups/${r.groupId}/events/${r.eventId}`;

  // Already had access (group member, the creator, or accepted before)
  if (r.wasAlready) {
    return (
      <WelcomeCard
        title={r.isCreator ? "That's your event." : "Already on your calendar."}
        subtitle={
          r.isCreator
            ? "You created this event — sharing the link with yourself doesn't change anything."
            : `You already have access to "${r.eventTitle}".`
        }
      >
        <button
          type="button"
          onClick={() => router.replace(eventHref)}
          className={cn(
            "mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          )}
        >
          Open event
        </button>
      </WelcomeCard>
    );
  }

  // Fresh accept
  return (
    <WelcomeCard
      title="Added to your calendar!"
      subtitle={`You can now RSVP to "${r.eventTitle}".`}
    >
      <div className="my-2 flex flex-col items-center gap-3 rounded-xl border border-positive/30 bg-positive/5 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/15 text-positive">
          <CheckCircle2 size={32} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <div className="text-md font-extrabold text-text">
            {r.eventTitle}
          </div>
          <div className="mt-0.5 text-sm text-text-muted">
            Shared by {r.sharerName} · open it to RSVP
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => router.replace("/calendar")}
          className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted hover:bg-surface-2"
        >
          Calendar
        </button>
        <button
          type="button"
          onClick={() => router.replace(eventHref)}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          )}
        >
          <CalendarCheck size={16} strokeWidth={2} />
          RSVP now
        </button>
      </div>
    </WelcomeCard>
  );
}

"use client";

/**
 * Invite-accept landing.
 *
 * Runs acceptInvite on mount and shows one of four UI states:
 *   1. Loading — spinner while the mutation runs
 *   2. Success (new member) — "You're in!" + group name + "Open group"
 *   3. Already-a-member — explanatory copy (covers re-scans and the
 *      common "I scanned my own invite as the owner" testing pitfall)
 *   4. Error — surfaces the mutation error + escape buttons
 *
 * We deliberately do NOT auto-redirect on success. A visible confirmation
 * is the whole point — silent redirects make the flow feel broken even
 * when it isn't.
 */
import { use, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Info } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { safeNextPath } from "@/lib/safeNext";
import type { Id } from "@/convex/_generated/dataModel";
import { clearPendingInvite } from "@/lib/hooks/usePendingInvite";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface AcceptResult {
  groupId: Id<"groups">;
  groupName: string;
  groupColor: string;
  wasAlreadyMember: boolean;
  isOwner: boolean;
}

export default function AcceptInvitePage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const acceptInvite = useMutation(api.invites.acceptInvite);
  const [result, setResult] = useState<AcceptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optional override for where to land after joining — used by event-share
  // links that thread `/groups/<id>/events/<eid>` through the join flow.
  // safeNextPath rejects external/protocol-relative targets (open-redirect).
  const next = safeNextPath(searchParams?.get("next"));

  useEffect(() => {
    let cancelled = false;
    acceptInvite({ token })
      .then((res) => {
        clearPendingInvite();
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) {
          clearPendingInvite();
          setError(err instanceof Error ? err.message : "Couldn't join group.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, acceptInvite]);

  // ── Loading ──────────────────────────────────────────────────────────
  if (!result && !error) {
    return (
      <WelcomeCard
        title="Joining group…"
        subtitle="One moment while we add you."
      >
        <div className="my-8 flex justify-center">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      </WelcomeCard>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <WelcomeCard
        title="Couldn't join."
        subtitle="There was an issue accepting this invite."
      >
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
        >
          <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/calendar")}
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted hover:bg-surface-2"
          >
            Go to calendar
          </button>
          <button
            type="button"
            onClick={() => router.push("/groups")}
            className="flex h-11 flex-1 items-center justify-center rounded-md bg-accent text-md font-extrabold text-white hover:bg-accent/90"
          >
            View groups
          </button>
        </div>
      </WelcomeCard>
    );
  }

  // result is non-null below.
  const r = result!;

  // ── Already-a-member (covers owner-scans-own-invite) ─────────────────
  if (r.wasAlreadyMember) {
    return (
      <WelcomeCard
        title={r.isOwner ? "That's your own invite." : "You're already in."}
        subtitle={
          r.isOwner
            ? "You created this group — sharing the link with yourself doesn't do anything. Send it to someone else to add them."
            : `You're already a member of ${r.groupName}.`
        }
      >
        <div className="my-2 flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-lg font-extrabold text-white"
            style={{ backgroundColor: r.groupColor }}
            aria-hidden="true"
          >
            {r.groupName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-md font-extrabold text-text">
              {r.groupName}
            </div>
            <div className="flex items-center gap-1 truncate text-sm text-text-muted">
              <Info size={12} strokeWidth={2} />
              {r.isOwner ? "You're the owner" : "Already joined"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.replace(next ?? `/groups/${r.groupId}`)}
          className={cn(
            "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          )}
        >
          {next ? "Continue" : "Open group"}
        </button>
      </WelcomeCard>
    );
  }

  // ── Success (fresh join) ─────────────────────────────────────────────
  return (
    <WelcomeCard
      title="You're in!"
      subtitle={`Welcome to ${r.groupName} on Decssy.`}
    >
      <div className="my-2 flex flex-col items-center gap-3 rounded-xl border border-positive/30 bg-positive/5 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/15 text-positive">
          <CheckCircle2 size={32} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <div className="text-md font-extrabold text-text">
            Joined {r.groupName}
          </div>
          <div className="mt-0.5 text-sm text-text-muted">
            {next
              ? "You can now open the event you were invited to."
              : "You can now see this group's events on your calendar."}
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
          onClick={() => router.replace(next ?? `/groups/${r.groupId}`)}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          )}
        >
          {next ? "Continue" : "Open group"}
        </button>
      </div>
    </WelcomeCard>
  );
}

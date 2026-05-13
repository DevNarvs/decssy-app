"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Mail, ArrowRight } from "lucide-react";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { getPendingInvite, setPendingInvite } from "@/lib/hooks/usePendingInvite";
import { cn } from "@/lib/utils";

export default function WelcomeStartPage() {
  const router = useRouter();
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Defense in depth: if a pending invite is sitting in localStorage (user
  // scanned a QR before signing up, then completed onboarding via a back-
  // button path that skipped /welcome/profile's auto-redirect), consume it
  // before the user can navigate to the wrong place.
  useEffect(() => {
    const token = getPendingInvite();
    if (token) {
      router.replace(`/join/${token}/accept`);
    }
  }, [router]);

  function handleInviteSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // Accept either a full URL containing /join/<token> or just the bare token.
    const urlMatch = inviteUrl.match(/\/join\/([A-Za-z0-9_-]+)/);
    const tokenMatch = inviteUrl.trim().match(/^([A-Za-z0-9_-]{20,})$/);
    const match = urlMatch ?? tokenMatch;
    if (!match || !match[1]) {
      setError("That doesn't look like a valid invite link.");
      return;
    }
    const token = match[1];
    setPendingInvite(token);
    router.push(`/join/${token}/accept`);
  }

  return (
    <WelcomeCard
      title="What's next?"
      subtitle="Create your first group, or jump in with an invite from a friend."
    >
      <StepIndicator current={2} />

      <div className="flex flex-col gap-3">
        <Link
          href="/groups/new"
          className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent hover:bg-accent-soft"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Users size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="text-md font-extrabold text-text">
              Create a group
            </div>
            <div className="mt-0.5 text-sm text-text-muted">
              Start a shared calendar with your friends, family, or team.
            </div>
          </div>
        </Link>

        {!showInviteInput ? (
          <button
            type="button"
            onClick={() => setShowInviteInput(true)}
            className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Mail size={20} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="text-md font-extrabold text-text">
                I have an invite link
              </div>
              <div className="mt-0.5 text-sm text-text-muted">
                Paste an invite URL or token to join a group.
              </div>
            </div>
          </button>
        ) : (
          <form
            onSubmit={handleInviteSubmit}
            className="flex flex-col gap-2 rounded-lg border border-accent bg-accent-soft/40 p-4"
          >
            <label
              htmlFor="invite-url"
              className="text-sm font-bold text-text"
            >
              Paste your invite link
            </label>
            <input
              id="invite-url"
              type="text"
              autoFocus
              value={inviteUrl}
              onChange={(e) => setInviteUrl(e.target.value)}
              placeholder="https://decssy.app/join/abc123…"
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            {error && (
              <div
                role="alert"
                className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
              >
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowInviteInput(false);
                  setError(null);
                  setInviteUrl("");
                }}
                className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inviteUrl.trim()}
                className={cn(
                  "flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                Join <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        )}

        <Link
          href="/calendar"
          className="mt-2 text-center text-sm font-bold text-text-muted hover:text-text"
        >
          Skip for now →
        </Link>
      </div>
    </WelcomeCard>
  );
}

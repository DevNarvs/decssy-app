"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { setPendingInvite } from "@/lib/hooks/usePendingInvite";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";

interface Preview {
  groupName: string;
  groupColor: string;
  groupDescription?: string;
  memberCount: number;
  ownerName: string;
  expiresAt: number;
}

interface Props {
  token: string;
  preview: Preview | null;
  /** Optional post-accept destination — e.g., event-share links pass
   *  /groups/<id>/events/<eid> so recipients land on the shared event
   *  after joining. Null means use the accept page's default. */
  next: string | null;
}

export function JoinLandingClient({ token, preview, next: nextProp }: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Accept-page URL with the next destination threaded through.
  const acceptPath = nextProp
    ? `/join/${token}/accept?next=${encodeURIComponent(nextProp)}`
    : `/join/${token}/accept`;

  // If we're authenticated, jump straight to /join/[token]/accept which
  // does the join + redirect. If not, store the token for post-auth resume
  // and show the public preview.
  useEffect(() => {
    if (!isLoading && isAuthenticated && preview) {
      router.replace(acceptPath);
    }
  }, [isLoading, isAuthenticated, preview, router, acceptPath]);

  // Pass the accept path as `?next=` to the auth pages so OAuth lands
  // directly at /accept (preserving the inner `next` for event-share links).
  function handleSignIn() {
    setPendingInvite(token);
    router.push(`/sign-in?next=${encodeURIComponent(acceptPath)}`);
  }
  function handleSignUp() {
    setPendingInvite(token);
    router.push(`/sign-up?next=${encodeURIComponent(acceptPath)}`);
  }

  if (!preview) {
    return (
      <WelcomeCard
        title="Invite not valid."
        subtitle="This invite link has expired, been revoked, or reached its use limit. Ask the group owner for a new one."
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

  const expiresIn = Math.ceil(
    (preview.expiresAt - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <WelcomeCard
      title="You've been invited."
      subtitle={`Join ${preview.groupName} on Decssy.`}
    >
      <div className="my-2 flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-lg font-extrabold text-white"
          style={{ backgroundColor: preview.groupColor }}
          aria-hidden="true"
        >
          {preview.groupName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-md font-extrabold text-text">
            {preview.groupName}
          </div>
          <div className="truncate text-sm text-text-muted">
            {preview.memberCount}{" "}
            {preview.memberCount === 1 ? "member" : "members"} · Created by{" "}
            {preview.ownerName}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSignUp}
          className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          Sign up & join
        </button>
        <button
          type="button"
          onClick={handleSignIn}
          className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted transition-colors hover:bg-surface-2"
        >
          Sign in instead
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-text-muted">
        Expires in {expiresIn} {expiresIn === 1 ? "day" : "days"}
      </p>
    </WelcomeCard>
  );
}

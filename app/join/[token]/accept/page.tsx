"use client";

import { use, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { clearPendingInvite } from "@/lib/hooks/usePendingInvite";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function AcceptInvitePage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const acceptInvite = useMutation(api.invites.acceptInvite);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    acceptInvite({ token })
      .then((groupId) => {
        clearPendingInvite();
        if (!cancelled) {
          router.replace(`/groups/${groupId}`);
        }
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
  }, [token, acceptInvite, router]);

  return (
    <WelcomeCard
      title={error ? "Couldn't join." : "Joining group…"}
      subtitle={error ? "There was an issue accepting this invite." : "One moment while we add you."}
    >
      {!error && (
        <div className="my-8 flex justify-center">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      )}
      {error && (
        <>
          <div
            role="alert"
            className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
          >
            {error}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/calendar")}
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted"
            >
              Go to calendar
            </button>
            <button
              type="button"
              onClick={() => router.push("/groups")}
              className="flex h-11 flex-1 items-center justify-center rounded-md bg-accent text-md font-extrabold text-white"
            >
              View groups
            </button>
          </div>
        </>
      )}
    </WelcomeCard>
  );
}

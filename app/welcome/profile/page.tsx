"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { getPendingInvite } from "@/lib/hooks/usePendingInvite";
import { cn } from "@/lib/utils";

export default function WelcomeProfilePage() {
  const router = useRouter();
  const user = useCurrentUser();
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill once user loads.
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!timezone) {
        const detected =
          user.timezone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone ??
          "UTC";
        setTimezone(detected);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      setError("Please enter your name.");
      return;
    }
    if (trimmedName.length > 50) {
      setError("Name is too long (max 50 characters).");
      return;
    }
    if (!timezone) {
      setError("Please pick a timezone.");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({ name: trimmedName, timezone });
      // Set the cookie middleware reads to skip onboarding redirects.
      document.cookie = `decssy_onboarded=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

      // If the user signed up via an invite QR scan or link, they already
      // chose where they want to go — skip the "what's next?" step and
      // consume the invite directly. Otherwise show the normal next step.
      const pending = getPendingInvite();
      if (pending) {
        router.push(`/join/${pending}/accept`);
      } else {
        router.push("/welcome/start");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <WelcomeCard
      title="Tell us about you."
      subtitle="This helps us show the right times for your group's events."
    >
      <StepIndicator current={1} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-bold text-text-muted">
            Your name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            placeholder="Marvin"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="timezone"
            className="text-sm font-bold text-text-muted"
          >
            Timezone
          </label>
          <input
            id="timezone"
            type="text"
            required
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={isSubmitting}
            className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            placeholder="America/New_York"
          />
          <p className="text-sm text-text-muted">
            Auto-detected. Edit if it's wrong.
          </p>
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
          disabled={isSubmitting || user === undefined}
          className={cn(
            "mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Continue
        </button>
      </form>
    </WelcomeCard>
  );
}

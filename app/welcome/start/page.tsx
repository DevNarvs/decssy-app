"use client";

import Link from "next/link";
import { Users, Mail } from "lucide-react";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

export default function WelcomeStartPage() {
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

        <button
          type="button"
          disabled
          className="group flex cursor-not-allowed items-start gap-3 rounded-lg border border-border bg-surface p-4 opacity-60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
            <Mail size={20} strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-md font-extrabold text-text">
              I have an invite link
            </div>
            <div className="mt-0.5 text-sm text-text-muted">
              Coming soon — invite links land in the next release.
            </div>
          </div>
        </button>

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

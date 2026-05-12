"use client";

import Link from "next/link";
import { WelcomeCard } from "@/components/onboarding/WelcomeCard";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

export default function WelcomeStep0Page() {
  return (
    <WelcomeCard
      title="Welcome to Decssy."
      subtitle="A shared calendar for the group chat. Let's set up your account."
    >
      <StepIndicator current={0} />

      <Link
        href="/welcome/profile"
        className="flex h-11 w-full items-center justify-center rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Get started →
      </Link>
    </WelcomeCard>
  );
}

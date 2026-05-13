import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Peach Fuzz styled card wrapper for onboarding steps.
 * Mirrors AuthCard's layout/styling for visual consistency.
 */
interface WelcomeCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function WelcomeCard({
  title,
  subtitle,
  children,
  className,
}: WelcomeCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div
        className={cn(
          "w-full max-w-sm rounded-xl bg-surface px-6 py-8 shadow-sm",
          className,
        )}
      >
        <div className="mb-4 flex justify-center">
          <Image
            src="/Decssy-Logo.png"
            alt="Decssy — a shared calendar for the group chat"
            width={140}
            height={140}
            priority
            className="h-32 w-32"
          />
        </div>

        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-text">
          {title}
        </h1>
        {subtitle && (
          <p className="mb-6 text-base text-text-muted">{subtitle}</p>
        )}

        {children}
      </div>
    </main>
  );
}

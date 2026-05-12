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
        <div className="mb-6 text-center text-3xl font-extrabold tracking-tight text-text">
          Decssy<span className="text-accent">.</span>
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

/**
 * Peach Fuzz styled card wrapper for auth pages.
 *
 * Used by sign-in and sign-up screens. Centered on screen, max width
 * for readability on tablet/desktop while staying full-bleed comfortable
 * on mobile.
 */
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  footer,
  children,
  className,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div
        className={cn(
          "w-full max-w-sm rounded-xl bg-surface px-6 py-8 shadow-sm",
          className,
        )}
      >
        {/* Brand */}
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

        {footer && (
          <div className="mt-6 border-t border-border pt-4 text-center text-base text-text-muted">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

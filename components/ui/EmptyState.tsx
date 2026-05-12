import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </div>
      <div className="text-lg font-extrabold tracking-tight text-text">
        {title}
      </div>
      <p className="max-w-xs text-md text-text-muted">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-2 flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

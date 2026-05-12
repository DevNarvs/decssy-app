"use client";

/**
 * Sign-out trigger. Calls Convex Auth's signOut(), which clears the session
 * cookie. Middleware then redirects the user to /sign-in on next request.
 *
 * Used in placeholder screens for now so testers can verify the auth loop
 * end-to-end. Later plans move this to the profile menu.
 */
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useAuthActions();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-text-muted",
        "transition-colors hover:bg-surface-2 hover:text-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
    >
      <LogOut size={14} strokeWidth={1.5} />
      Sign out
    </button>
  );
}

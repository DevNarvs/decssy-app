"use client";

/**
 * Shared placeholder for tabs whose real UI ships in later plans.
 * Renders the signed-in user's name as proof the full auth loop worked.
 */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "./nav/SignOutButton";

interface PlaceholderScreenProps {
  title: string;
  comingIn: string;
}

export function PlaceholderScreen({ title, comingIn }: PlaceholderScreenProps) {
  const user = useQuery(api.users.getCurrentUser);

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-2 px-6 py-12 text-center md:min-h-screen">
      <div className="text-3xl font-extrabold tracking-tight text-text">{title}</div>
      <p className="max-w-xs text-md text-text-muted">{comingIn}</p>

      {user !== undefined && (
        <div className="mt-8 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted shadow-sm">
          {user === null ? (
            "Loading session..."
          ) : (
            <>
              Signed in as{" "}
              <span className="font-bold text-text">
                {user.email ?? user.name ?? "anonymous"}
              </span>
            </>
          )}
        </div>
      )}

      <SignOutButton className="mt-4" />
    </div>
  );
}

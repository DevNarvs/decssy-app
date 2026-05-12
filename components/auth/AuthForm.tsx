"use client";

/**
 * Shared form for sign-in and sign-up flows.
 *
 * Differences between the two flows:
 *   - Title and subtitle (set by the parent page via the AuthCard)
 *   - The Password provider's `flow` argument ("signIn" vs "signUp")
 *   - The footer swap-link text ("Need an account?" vs "Already have one?")
 *
 * Everything else — Google OAuth button, password field validation, error
 * surfacing, loading states — is identical.
 */
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "./GoogleIcon";
import { cn } from "@/lib/utils";

type Flow = "signIn" | "signUp";

interface AuthFormProps {
  flow: Flow;
}

export function AuthForm({ flow }: AuthFormProps) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isBusy = isPasswordLoading || isGoogleLoading;

  async function handleGoogle() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signIn("google", { redirectTo: "/calendar" });
      // signIn redirects away — code below won't execute on success
    } catch (err) {
      setError(humanizeError(err));
      setIsGoogleLoading(false);
    }
  }

  async function handlePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsPasswordLoading(true);
    try {
      await signIn("password", { email, password, flow });
      router.push("/calendar");
    } catch (err) {
      setError(humanizeError(err, flow));
      setIsPasswordLoading(false);
    }
  }

  const submitLabel = flow === "signUp" ? "Create account" : "Sign in";

  return (
    <div className="flex flex-col gap-4">
      {/* Google OAuth button */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={isBusy}
        className={cn(
          "flex h-11 items-center justify-center gap-2.5 rounded-md border border-border bg-surface",
          "text-md font-bold text-text transition-colors",
          "hover:bg-surface-2 active:bg-surface-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isGoogleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <GoogleIcon size={18} />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email + password form */}
      <form onSubmit={handlePassword} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-bold text-text-muted"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isBusy}
            className={cn(
              "h-11 rounded-md border border-border bg-surface px-3 text-md text-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              "disabled:opacity-60",
            )}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-bold text-text-muted"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={flow === "signUp" ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isBusy}
            className={cn(
              "h-11 rounded-md border border-border bg-surface px-3 text-md text-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              "disabled:opacity-60",
            )}
            placeholder={flow === "signUp" ? "At least 8 characters" : ""}
          />
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
          disabled={isBusy}
          className={cn(
            "mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-accent",
            "text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 active:bg-accent/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isPasswordLoading && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </form>
    </div>
  );
}

/**
 * Map Convex Auth errors to user-friendly copy.
 *
 * Convex Auth's Password provider throws plain `Error("Invalid credentials")`
 * for any wrong-email-OR-wrong-password combination (a deliberate security
 * choice — never tell attackers which half is wrong). The flow context lets
 * us still write copy that's slightly more action-oriented per page.
 *
 * Other error shapes we've seen in practice:
 *   - "Server Error" wrapper around the underlying message
 *   - "ConvexError" prefix
 *   - 400 with no message at all (timeout / network race)
 */
function humanizeError(err: unknown, flow: Flow): string {
  const fallback =
    flow === "signUp"
      ? "Couldn't create your account. Try again."
      : "Couldn't sign you in. Check your email and password.";
  if (!err) return fallback;
  const msg = err instanceof Error ? err.message : String(err);

  // Wrong email-password combo (most common case)
  if (/Invalid credentials|InvalidSecret|InvalidAccountId|wrong.*password/i.test(msg)) {
    return flow === "signUp"
      ? "Couldn't create that account. The email may already be taken — try signing in."
      : "Wrong email or password. Try again, or use Google sign-in.";
  }

  // Account already exists (signUp flow)
  if (/AlreadyExists|account.*exists|duplicate.*email/i.test(msg)) {
    return "An account with that email already exists. Try signing in instead.";
  }

  // Validation failures we don't catch client-side
  if (/Missing.*password|Missing.*email|Missing.*flow/i.test(msg)) {
    return "Please fill in both email and password.";
  }

  // Network / connectivity
  if (/network|fetch failed|ENOTFOUND|Failed to fetch/i.test(msg)) {
    return "Network error. Check your connection and try again.";
  }

  // Provider misconfiguration (devs see this — users shouldn't)
  if (/provider.*not.*configured|Missing.*AUTH_/i.test(msg)) {
    return "Sign-in is temporarily unavailable. Please try again later.";
  }

  // Catch-all: only show raw message if it's short and reasonable;
  // otherwise show flow-aware fallback.
  return msg.length > 0 && msg.length < 80 && !msg.includes("\n") ? msg : fallback;
}

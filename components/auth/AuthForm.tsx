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
      setError(humanizeError(err));
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
 * Convex Auth surfaces several error shapes:
 *   - Server-side ConvexError with a `data` payload (e.g., "InvalidPassword")
 *   - Generic JS Error with a `.message`
 *   - Plain strings (rare)
 *
 * Map known codes to friendly copy; fall back to the raw message.
 */
function humanizeError(err: unknown): string {
  const fallback = "Something went wrong. Try again.";
  if (!err) return fallback;
  const msg = err instanceof Error ? err.message : String(err);

  if (/InvalidAccountId|account.*not.*found/i.test(msg)) {
    return "No account with that email. Try signing up instead.";
  }
  if (/InvalidPassword|wrong.*password/i.test(msg)) {
    return "Wrong password. Try again or use Google sign-in.";
  }
  if (/AlreadyExists|account.*exists/i.test(msg)) {
    return "An account with that email already exists. Try signing in.";
  }
  if (/network|fetch failed|ENOTFOUND/i.test(msg)) {
    return "Network error. Check your connection and try again.";
  }
  return msg.length > 120 ? fallback : msg;
}

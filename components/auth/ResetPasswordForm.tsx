"use client";

/**
 * Two-step password reset for the Convex Auth Password provider.
 *
 * Step 1 ("request"): user enters their email → signIn("password", { email,
 * flow: "reset" }) mails an OTP. We ALWAYS advance to step 2 afterward and
 * show a neutral "if an account exists…" message, so the screen can't be used
 * to enumerate which emails have accounts.
 *
 * Step 2 ("verify"): user enters the code + a new password → signIn("password",
 * { email, code, newPassword, flow: "reset-verification" }). On success the
 * library signs them in, so we drive navigation from useConvexAuth() rather
 * than the signIn call (which can throw a benign post-auth 400 — same race the
 * sign-in form already handles).
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResetPasswordForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Navigate once the reset-verification has actually signed the user in.
  useEffect(() => {
    if (isAuthenticated) router.replace("/calendar");
  }, [isAuthenticated, router]);

  // Ref so the post-verify catch can read live auth state inside the closure.
  const isAuthedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  async function handleRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email, flow: "reset" });
    } catch {
      // Swallow — advancing regardless prevents account enumeration.
    } finally {
      setLoading(false);
    }
    // Always advance with a neutral message.
    setNotice(
      "If an account exists for that email, we sent a 6–8 digit code. Enter it below.",
    );
    setStep("verify");
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 4) {
      setError("Enter the code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", {
        email,
        code: code.trim(),
        newPassword,
        flow: "reset-verification",
      });
      // Navigation handled by the isAuthenticated effect.
    } catch (err) {
      // Convex Auth can throw a 400 on the follow-up token call even when the
      // reset succeeded; defer the verdict to the actual auth state.
      await new Promise((r) => setTimeout(r, 250));
      if (!isAuthedRef.current) {
        const msg = err instanceof Error ? err.message : "";
        setError(
          /invalid|expired|not found|incorrect|verify/i.test(msg)
            ? "That code is wrong or expired. Request a new one."
            : "Couldn't reset your password. Try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60";

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <div className="rounded-md bg-accent-soft px-3 py-2 text-sm font-bold text-accent">
          {notice}
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleRequest} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-email" className="text-sm font-bold text-text-muted">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>
          {error && (
            <div role="alert" className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Send reset code
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-code" className="text-sm font-bold text-text-muted">
              Reset code
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              className={inputCls}
              placeholder="12345678"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-new-password" className="text-sm font-bold text-text-muted">
              New password
            </label>
            <input
              id="reset-new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className={inputCls}
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <div role="alert" className="rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Set new password
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setError(null);
              setNotice(null);
            }}
            className="text-center text-sm font-bold text-text-muted hover:text-text"
          >
            ← Use a different email
          </button>
        </form>
      )}

      <div className="border-t border-border pt-4 text-center text-base text-text-muted">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-extrabold text-accent">
          Sign in
        </Link>
      </div>
    </div>
  );
}

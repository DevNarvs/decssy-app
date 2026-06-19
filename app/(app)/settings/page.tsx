"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { PushManager } from "@/components/push/PushManager";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

type PrefKey =
  | "event_invite"
  | "event_updated"
  | "event_cancelled"
  | "comment_added"
  | "invite_accepted"
  | "ownership_transferred"
  | "event_reminder";

const PREF_LABELS: Record<PrefKey, { label: string; description: string }> = {
  event_invite: {
    label: "Event invitations",
    description: "Someone added you to a personal event or group event",
  },
  event_updated: {
    label: "Event updates",
    description: "An event you're attending was edited (time, place, etc.)",
  },
  event_cancelled: {
    label: "Event cancellations",
    description: "An event you were attending was cancelled",
  },
  comment_added: {
    label: "Comments",
    description: "Someone commented on an event you're on (off by default — high noise)",
  },
  invite_accepted: {
    label: "New members joining",
    description: "Someone accepted your group's invite link (owners only)",
  },
  ownership_transferred: {
    label: "Ownership transfer",
    description: "You were made the owner of a group",
  },
  event_reminder: {
    label: "Event reminders",
    description: "A heads-up before an event you're attending starts",
  },
};

// Defaults (mirror convex/crons.ts)
function defaultFor(key: PrefKey): boolean {
  return key !== "comment_added";
}

export default function SettingsPage() {
  const user = useCurrentUser();
  const updatePrefs = useMutation(api.users.updateNotificationPrefs);

  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(() => {
    const result = {} as Record<PrefKey, boolean>;
    (Object.keys(PREF_LABELS) as PrefKey[]).forEach((k) => {
      result[k] = defaultFor(k);
    });
    return result;
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Hydrate from user record once loaded.
  useEffect(() => {
    if (!user) return;
    const stored = user.notificationEmailPrefs;
    if (!stored) return;
    setPrefs((current) => {
      const next = { ...current };
      (Object.keys(PREF_LABELS) as PrefKey[]).forEach((k) => {
        const v = stored[k];
        if (v !== undefined) next[k] = v;
      });
      return next;
    });
  }, [user]);

  async function toggle(key: PrefKey) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      await updatePrefs({ prefs: next });
      setSavedAt(Date.now());
    } catch (err) {
      console.warn("Save prefs failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link
          href="/calendar"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-text">
          Settings
        </h1>
      </header>

      <div className="space-y-6">
        {/* Profile */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-text-muted">
            Profile
          </h2>
          {user ? (
            <div>
              <div className="text-md font-extrabold text-text">
                {user.name ?? "Unnamed"}
              </div>
              <div className="text-sm text-text-muted">{user.email ?? ""}</div>
              {user.timezone && (
                <div className="mt-1 text-sm text-text-muted">
                  Timezone: {user.timezone}
                </div>
              )}
            </div>
          ) : (
            <div className="h-12 animate-pulse rounded-md bg-surface-2" />
          )}
        </section>

        {/* Push notifications */}
        <PushManager />

        {/* Notification preferences */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-text-muted">
              Email notifications
            </h2>
            {saving && (
              <Loader2 size={14} className="animate-spin text-text-muted" />
            )}
            {!saving && savedAt && (
              <span className="text-xs font-bold text-positive">Saved</span>
            )}
          </div>
          <ul className="space-y-2">
            {(Object.keys(PREF_LABELS) as PrefKey[]).map((key) => {
              const p = PREF_LABELS[key];
              return (
                <li
                  key={key}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-md font-bold text-text">
                      {p.label}
                    </div>
                    <div className="text-sm text-text-muted">
                      {p.description}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    role="switch"
                    aria-checked={prefs[key]}
                    aria-label={p.label}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                      prefs[key] ? "bg-accent" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                        prefs[key] ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Sign out */}
        <section>
          <SignOutButton className="w-full justify-center" />
        </section>

        {/* Delete account */}
        <DeleteAccountSection />

        {/* App version (semver + precise build id) */}
        <p className="pb-4 text-center text-xs text-text-muted">
          Decssy · v{env.NEXT_PUBLIC_APP_VERSION}
          {env.NEXT_PUBLIC_APP_BUILD !== "dev" && (
            <span className="text-text-muted/70"> ({env.NEXT_PUBLIC_APP_BUILD})</span>
          )}
        </p>
      </div>
    </div>
  );
}

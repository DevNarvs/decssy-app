"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { Share2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";

interface InviteShareCardProps {
  token: string;
  baseUrl: string; // e.g., "http://localhost:3002" or production URL
}

export function InviteShareCard({ token, baseUrl }: InviteShareCardProps) {
  const generate = useAction(api.qr.generate);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  const url = `${baseUrl}/join/${token}`;

  useEffect(() => {
    let cancelled = false;
    generate({ data: url })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch((err) => {
        console.warn("QR generation failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [url, generate]);

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({
        title: "Join my Decssy group",
        text: "I'd love to add you to our shared calendar.",
        url,
      });
    } catch {
      // user cancelled — silent.
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6">
      <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-bg">
        {qrSvg ? (
          <div
            className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            role="img"
            aria-label="QR code for invite link"
          />
        ) : (
          <div className="text-sm text-text-muted">Generating QR…</div>
        )}
      </div>

      <div className="w-full">
        <label
          htmlFor="invite-url"
          className="mb-1 block text-sm font-bold text-text-muted"
        >
          Or share the link
        </label>
        <div className="flex gap-2">
          <input
            id="invite-url"
            type="text"
            readOnly
            value={url}
            onClick={(e) => e.currentTarget.select()}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text-muted"
          />
          <CopyButton value={url} />
        </div>
      </div>

      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
            "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          )}
        >
          <Share2 size={16} strokeWidth={1.5} />
          Share via…
        </button>
      )}
    </div>
  );
}

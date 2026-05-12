"use client";

/**
 * Modal confirmation dialog with backdrop, focus trap, and Esc-to-dismiss.
 *
 * Replaces native `confirm()` for destructive actions — looks like the rest
 * of the Peach Fuzz app, supports loading state during async confirm, and
 * is accessible (role=dialog, aria-modal, focus management).
 *
 * Mobile behaviour: sits at the bottom of the screen (sheet-like).
 * Tablet+: centered modal.
 */
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isProcessing?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  isProcessing = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the safe (cancel) button when opened — prevents accidental Enter
  // submission of the destructive confirm.
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isProcessing) onClose();
    }
    window.addEventListener("keydown", onKey);

    // Lock body scroll while open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, isProcessing]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={isProcessing ? undefined : onClose}
        disabled={isProcessing}
        className="fixed inset-0 cursor-default bg-text/40 backdrop-blur-sm disabled:cursor-not-allowed"
      />

      {/* Card */}
      <div
        className={cn(
          "relative w-full max-w-sm rounded-xl bg-surface p-6 shadow-md",
          // On mobile, slide up from bottom feel
          "animate-in fade-in slide-in-from-bottom-4 duration-200",
        )}
      >
        <h2
          id="confirm-dialog-title"
          className="mb-2 text-lg font-extrabold tracking-tight text-text"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-description"
          className="mb-6 text-md text-text-muted"
        >
          {description}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-md font-extrabold transition-colors",
              variant === "danger"
                ? "border-2 border-negative bg-surface text-negative hover:bg-negative/10"
                : "bg-accent text-white shadow-fab hover:bg-accent/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              variant === "danger"
                ? "focus-visible:ring-negative"
                : "focus-visible:ring-accent",
              isProcessing && "cursor-not-allowed opacity-60",
            )}
          >
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
          <button
            type="button"
            ref={cancelRef}
            onClick={onClose}
            disabled={isProcessing}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface text-md font-bold text-text-muted transition-colors hover:bg-surface-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isProcessing && "cursor-not-allowed opacity-60",
            )}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

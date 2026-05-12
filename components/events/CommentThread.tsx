"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Loader2, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Comment {
  _id: Id<"eventComments">;
  userId: Id<"users">;
  authorName: string;
  body: string;
  createdAt: number;
  isYou: boolean;
}

interface Props {
  eventId: Id<"events">;
  comments: Comment[];
  groupColor: string;
}

function formatRelative(ms: number): string {
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(ms).toLocaleDateString();
}

export function CommentThread({ eventId, comments, groupColor }: Props) {
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setIsSending(true);
    try {
      await addComment({ eventId, body });
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send comment.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDelete(commentId: Id<"eventComments">) {
    try {
      await deleteComment({ commentId });
    } catch (err) {
      console.warn("Delete comment failed:", err);
    }
  }

  return (
    <div>
      <h3 className="mb-2 px-1 text-sm font-extrabold uppercase tracking-wide text-text-muted">
        Comments ({comments.length})
      </h3>

      {comments.length > 0 && (
        <ul className="mb-3 space-y-2">
          {comments.map((c) => (
            <li
              key={c._id}
              className="flex gap-2.5 rounded-md border border-border bg-surface p-3"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ backgroundColor: groupColor }}
                aria-hidden="true"
              >
                {c.authorName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-extrabold text-text">
                    {c.authorName}
                    {c.isYou && (
                      <span className="ml-1 text-sm font-normal text-text-muted">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatRelative(c.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-md text-text">
                  {c.body}
                </p>
              </div>
              {c.isYou && (
                <button
                  type="button"
                  onClick={() => handleDelete(c._id)}
                  className="text-text-muted hover:text-negative"
                  aria-label="Delete comment"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isSending}
          placeholder="Add a comment…"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button
          type="submit"
          disabled={isSending || !body.trim()}
          className={cn(
            "flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-extrabold text-white shadow-fab transition-colors hover:bg-accent/90",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSending ? <Loader2 size={14} className="animate-spin" /> : "Send"}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-2 rounded-md bg-negative/10 px-3 py-2 text-sm font-bold text-negative"
        >
          {error}
        </div>
      )}
    </div>
  );
}

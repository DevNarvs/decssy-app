"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ColorPicker } from "./ColorPicker";
import { GROUP_COLORS, type GroupColor } from "@/convex/lib/groupColors";
import { cn } from "@/lib/utils";

export function GroupCreateForm() {
  const router = useRouter();
  const createGroup = useMutation(api.groups.createGroup);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<GroupColor>(GROUP_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 1) {
      setError("Please give your group a name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const groupId = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      router.push(`/groups/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create group.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Color + initial preview */}
      <div className="flex justify-center">
        <div
          className="flex items-center justify-center rounded-xl text-3xl font-extrabold text-white shadow-sm"
          style={{ backgroundColor: color, width: 72, height: 72 }}
          aria-hidden="true"
        >
          {(name.trim().slice(0, 1) || "G").toUpperCase()}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-bold text-text-muted">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          placeholder="Family"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-bold text-text-muted"
        >
          Description{" "}
          <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={2}
          maxLength={280}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="rounded-md border border-border bg-surface px-3 py-2 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          placeholder="Our family group"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-text-muted">Color</label>
        <ColorPicker
          value={color}
          onChange={setColor}
          disabled={isSubmitting}
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
        disabled={isSubmitting}
        className={cn(
          "mt-2 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
          "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Create group
      </button>
    </form>
  );
}

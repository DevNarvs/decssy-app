"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ColorPicker } from "./ColorPicker";
import { isValidGroupColor, type GroupColor } from "@/convex/lib/groupColors";
import { cn } from "@/lib/utils";

export function GroupSettingsForm({ group }: { group: Doc<"groups"> }) {
  const updateGroup = useMutation(api.groups.updateGroup);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const initialColor = (
    isValidGroupColor(group.color) ? group.color : "#10B981"
  ) as GroupColor;
  const [color, setColor] = useState<GroupColor>(initialColor);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setIsSubmitting(true);
    try {
      await updateGroup({
        groupId: group._id as Id<"groups">,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          disabled={isSubmitting}
          className="h-11 rounded-md border border-border bg-surface px-3 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-bold text-text-muted"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          maxLength={280}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSaved(false);
          }}
          disabled={isSubmitting}
          className="rounded-md border border-border bg-surface px-3 py-2 text-md text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-text-muted">Color</label>
        <ColorPicker
          value={color}
          onChange={(c) => {
            setColor(c);
            setSaved(false);
          }}
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
      {saved && !error && (
        <div
          role="status"
          className="rounded-md bg-positive/10 px-3 py-2 text-sm font-bold text-positive"
        >
          Saved.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-md font-extrabold text-white shadow-fab transition-colors",
          "hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Save changes
      </button>
    </form>
  );
}

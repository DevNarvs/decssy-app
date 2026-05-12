"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Props {
  groups: Doc<"groups">[];
}

export function CreateEventFAB({ groups }: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleClick() {
    if (groups.length === 0) {
      // No groups yet — send them to create one.
      router.push("/groups/new");
      return;
    }
    if (groups.length === 1) {
      const onlyGroup = groups[0];
      if (onlyGroup) {
        router.push(`/groups/${onlyGroup._id}/events/new`);
        return;
      }
    }
    setPickerOpen(true);
  }

  // Lock body scroll while picker open
  useEffect(() => {
    if (!pickerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Create event"
        className={cn(
          "fixed bottom-20 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-accent text-white shadow-fab transition-transform",
          "hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "md:bottom-6 md:right-6",
        )}
        style={{ height: 52, width: 52 }}
      >
        <Plus size={24} strokeWidth={2} />
      </button>

      {pickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pick a group"
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setPickerOpen(false)}
            className="fixed inset-0 cursor-default bg-text/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-xl bg-surface p-4 shadow-md">
            <h2 className="mb-3 px-2 text-md font-extrabold text-text">
              Create event in…
            </h2>
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {groups.map((g) => (
                <li key={g._id}>
                  <Link
                    href={`/groups/${g._id}/events/new`}
                    className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:bg-surface-2"
                    onClick={() => setPickerOpen(false)}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-md font-extrabold text-white"
                      style={{ backgroundColor: g.color }}
                      aria-hidden="true"
                    >
                      {g.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-md font-bold text-text">
                      {g.name}
                    </span>
                    <ChevronRight
                      size={16}
                      strokeWidth={1.5}
                      className="text-text-muted"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

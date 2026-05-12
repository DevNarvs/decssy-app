"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Props {
  groups: Doc<"groups">[];
  selectedIds: Set<string>;
  onToggle: (groupId: Id<"groups">) => void;
}

export function GroupFilterChips({ groups, selectedIds, onToggle }: Props) {
  const filterActive = selectedIds.size > 0 && selectedIds.size < groups.length;

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      {groups.map((g) => {
        const isOn = selectedIds.has(g._id.toString()) || !filterActive;
        return (
          <button
            key={g._id}
            type="button"
            onClick={() => onToggle(g._id)}
            aria-pressed={selectedIds.has(g._id.toString())}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            )}
            style={{
              borderColor: isOn ? g.color : "var(--color-border)",
              backgroundColor: isOn ? `${g.color}1A` : "var(--color-surface)",
              color: isOn ? g.color : "var(--color-text-muted)",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: g.color }}
              aria-hidden="true"
            />
            {g.name}
          </button>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface GroupCardProps {
  group: Doc<"groups">;
  memberCount: number;
  isOwner: boolean;
}

export function GroupCard({ group, memberCount, isOwner }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group._id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-lg font-extrabold text-white"
        style={{ backgroundColor: group.color }}
        aria-hidden="true"
      >
        {group.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-md font-extrabold text-text">
          {group.name}
        </div>
        <div className="truncate text-sm text-text-muted">
          {memberCount} {memberCount === 1 ? "member" : "members"}
          {isOwner && " · You're the owner"}
        </div>
      </div>
      <ChevronRight size={18} strokeWidth={1.5} className="text-text-muted" />
    </Link>
  );
}

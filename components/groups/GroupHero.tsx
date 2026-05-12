import type { Doc } from "@/convex/_generated/dataModel";

interface GroupHeroProps {
  group: Doc<"groups">;
  memberCount: number;
  isOwner: boolean;
}

export function GroupHero({ group, memberCount, isOwner }: GroupHeroProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl font-extrabold text-white"
          style={{ backgroundColor: group.color }}
          aria-hidden="true"
        >
          {group.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-text">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-0.5 text-sm text-text-muted">
              {group.description}
            </p>
          )}
          <p className="mt-1 text-sm text-text-muted">
            {memberCount} {memberCount === 1 ? "member" : "members"}
            {isOwner && " · You're the owner"}
          </p>
        </div>
      </div>
    </div>
  );
}

import type { Id } from "@/convex/_generated/dataModel";

interface Member {
  userId: Id<"users">;
  name: string;
  email: string;
  joinedAt: number;
  isOwner: boolean;
  isYou: boolean;
}

export function MemberList({
  members,
  groupColor,
}: {
  members: Member[];
  groupColor: string;
}) {
  return (
    <ul className="space-y-2">
      {members.map((m) => (
        <li
          key={m.userId}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-md font-extrabold text-white"
            style={{ backgroundColor: groupColor }}
            aria-hidden="true"
          >
            {m.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-md font-bold text-text">
              {m.name}
              {m.isYou && (
                <span className="ml-1.5 text-sm font-normal text-text-muted">
                  (you)
                </span>
              )}
            </div>
            <div className="truncate text-sm text-text-muted">{m.email}</div>
          </div>
          {m.isOwner && (
            <span className="rounded-sm bg-accent-soft px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-accent">
              Owner
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

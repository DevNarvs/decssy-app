"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Calendar, Users, Search, Bell } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/find", label: "Find", icon: Search },
  { href: "/inbox", label: "Inbox", icon: Bell },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const unread = useQuery(api.notifications.countUnread) ?? 0;

  return (
    <aside
      aria-label="Primary"
      className="fixed bottom-0 left-0 top-0 z-30 hidden w-60 flex-col border-r border-border bg-surface md:flex"
    >
      <div className="px-6 py-6 text-3xl font-extrabold tracking-tight text-text">
        Decssy<span className="text-accent">.</span>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            const showBadge = tab.href === "/inbox" && unread > 0;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-md font-bold transition-colors",
                    isActive
                      ? "bg-accent-soft text-accent"
                      : "text-text-muted hover:bg-surface-2 hover:text-text",
                  )}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  <span className="flex-1">{tab.label}</span>
                  {showBadge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-extrabold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

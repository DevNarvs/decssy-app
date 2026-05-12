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

export function BottomTabBar() {
  const pathname = usePathname();
  const unread = useQuery(api.notifications.countUnread) ?? 0;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface pb-safe shadow-nav md:hidden"
    >
      <ul className="flex h-16 items-stretch justify-around">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const showBadge = tab.href === "/inbox" && unread > 0;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-label={
                  showBadge ? `${tab.label} (${unread} unread)` : tab.label
                }
                aria-current={isActive ? "page" : undefined}
                className="flex h-full flex-col items-center justify-center gap-0.5 px-2 transition-colors duration-150"
              >
                <span
                  className={cn(
                    "relative flex h-9 w-11 items-center justify-center rounded-md transition-colors",
                    isActive ? "bg-accent-soft" : "bg-transparent",
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    className={cn(isActive ? "text-accent" : "text-text-muted")}
                  />
                  {showBadge && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-white"
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-extrabold leading-none",
                    isActive ? "text-accent" : "text-text-muted",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

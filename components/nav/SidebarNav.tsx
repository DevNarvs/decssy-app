"use client";

/**
 * Tablet+ left sidebar (hidden on mobile via hidden md:flex).
 *
 * Mirrors BottomTabBar's items but laid out vertically with text labels
 * always visible. Brand wordmark sits at the top.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/find", label: "Find", icon: Search },
  { href: "/inbox", label: "Inbox", icon: Bell },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

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
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { SidebarNav } from "@/components/nav/SidebarNav";

/**
 * Auth-protected route group layout.
 *
 * Middleware ensures everything under (app)/ requires an authenticated
 * session. This layout supplies the adaptive nav (bottom tabs on mobile,
 * left sidebar on tablet+) and reserves space for content beside/above
 * the nav.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <SidebarNav />
      <main className="min-h-screen pb-nav md:ml-60 md:pb-0">{children}</main>
      <BottomTabBar />
    </div>
  );
}

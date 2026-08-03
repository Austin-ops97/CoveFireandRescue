"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/site/Button";
import { MobileDrawer } from "@/components/ui/MobileDrawer";
import { useAuth } from "@/hooks/useAuth";
import { canAccessDashboard } from "@/lib/auth/roles";
import {
  getGroupedDashboardNavItems,
  getVisibleDashboardNavItems,
  isDashboardNavItemActive,
} from "@/lib/config/dashboard-modules";
import { fetchUnreadNotificationCount } from "@/lib/notifications/client";
import {
  fetchRequestTickets,
  REQUEST_TICKETS_CHANGED_EVENT,
} from "@/lib/request-tickets/client";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading, signOutUser } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (role !== "admin") return;

    let cancelled = false;

    async function loadAdminCounts() {
      try {
        const [notificationCount, tickets] = await Promise.all([
          fetchUnreadNotificationCount(),
          fetchRequestTickets(),
        ]);
        if (!cancelled) {
          setUnreadNotifications(notificationCount);
          setUnreadRequests(tickets.filter((ticket) => ticket.adminNotificationUnread).length);
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0);
          setUnreadRequests(0);
        }
      }
    }

    void loadAdminCounts();
    const interval = window.setInterval(() => void loadAdminCounts(), 60_000);
    const handleRequestTicketsChanged = () => void loadAdminCounts();
    window.addEventListener(REQUEST_TICKETS_CHANGED_EVENT, handleRequestTicketsChanged);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener(REQUEST_TICKETS_CHANGED_EVENT, handleRequestTicketsChanged);
    };
  }, [role]);

  const navItems = getVisibleDashboardNavItems(role);
  const navGroups = getGroupedDashboardNavItems(role);
  const onDashboardHome = pathname === "/dashboard";
  const displayName = profile?.displayName?.trim() || user?.email || "Member";

  const currentPageLabel = useMemo(() => {
    const active = navItems.find((item) => isDashboardNavItemActive(pathname, item));
    return active?.label ?? "Dashboard";
  }, [navItems, pathname]);

  if (!user || (!loading && !canAccessDashboard(role))) {
    return null;
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  }

  const linkClass = (active: boolean) =>
    `inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 ${
      active
        ? "border-gold-500 bg-gold-500 text-navy-900"
        : "border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
    }`;

  const drawerLinkClass = (active: boolean) =>
    `flex min-h-11 items-center rounded-lg px-3 py-2.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 ${
      active
        ? "bg-gold-500/15 text-navy-900 ring-1 ring-gold-500/40"
        : "text-brand-charcoal hover:bg-gray-100"
    }`;

  return (
    <div className="border-b-2 border-gold-500 bg-navy-900 text-white shadow-lg safe-area-x md:border-b-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 py-2 md:flex-wrap md:gap-3 md:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {!onDashboardHome && (
              <Link
                href="/dashboard"
                className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 sm:inline-flex"
              >
                <span aria-hidden>←</span>
                <span className="hidden sm:inline">Dashboard home</span>
                <span className="sm:hidden">Home</span>
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <p className="hidden text-xs font-bold uppercase tracking-[0.14em] text-gold-500 md:block">
                Member portal
              </p>
              <p className="truncate text-sm text-white/90">
                <span className="font-semibold text-white">{displayName}</span>
                <span className="mx-1.5 text-white/40 md:hidden">·</span>
                <span className="text-gold-500 md:hidden">{currentPageLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="dashboard-mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
            <Button
              type="button"
              variant="heroTertiary"
              size="sm"
              className="!min-h-9 !px-3 !py-1.5 !text-xs md:!min-h-11 md:!px-3 md:!py-2 md:!text-sm"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
            >
              {signingOut ? "…" : "Sign out"}
            </Button>
          </div>
        </div>

        <nav
          aria-label="Dashboard tools"
          className="hidden border-t border-white/15 pb-4 pt-3 md:block"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
            Jump to a tool
          </p>
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = isDashboardNavItemActive(pathname, item);
              const badgeCount =
                item.href === "/dashboard/rounds/notifications"
                  ? unreadNotifications
                  : item.href === "/dashboard/requests"
                    ? unreadRequests
                    : 0;
              const showBadge = badgeCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  {showBadge && (
                    <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-xs font-bold text-white">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Dashboard tools"
        id="dashboard-mobile-menu"
      >
        <nav aria-label="Dashboard tools" className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-brand-gray">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = isDashboardNavItemActive(pathname, item);
                  const badgeCount =
                    item.href === "/dashboard/rounds/notifications"
                      ? unreadNotifications
                      : item.href === "/dashboard/requests"
                        ? unreadRequests
                        : 0;
                  const showBadge = badgeCount > 0;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={drawerLinkClass(active)}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="flex-1">{item.label}</span>
                        {showBadge && (
                          <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-xs font-bold text-white">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </MobileDrawer>
    </div>
  );
}

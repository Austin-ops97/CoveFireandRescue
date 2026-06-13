"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/site/Button";
import { useAuth } from "@/hooks/useAuth";
import { canAccessDashboard } from "@/lib/auth/roles";
import {
  getVisibleDashboardNavItems,
  isDashboardNavItemActive,
} from "@/lib/config/dashboard-modules";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading, signOutUser } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (!user || (!loading && !canAccessDashboard(role))) {
    return null;
  }

  const navItems = getVisibleDashboardNavItems(role);
  const onDashboardHome = pathname === "/dashboard";
  const displayName = profile?.displayName?.trim() || user.email || "Member";

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

  return (
    <div className="border-b-4 border-gold-500 bg-navy-900 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {!onDashboardHome && (
              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
              >
                <span aria-hidden>←</span>
                <span>Dashboard home</span>
              </Link>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-500">
                Member portal
              </p>
              <p className="truncate text-sm text-white/80">
                Signed in as <span className="font-semibold text-white">{displayName}</span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="heroTertiary"
            size="sm"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>

        <nav aria-label="Dashboard tools" className="border-t border-white/15 pb-4 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
            Jump to a tool
          </p>
          <div className="flex flex-wrap gap-2 max-md:flex-nowrap max-md:overflow-x-auto max-md:pb-1 max-md:[-ms-overflow-style:none] max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const active = isDashboardNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

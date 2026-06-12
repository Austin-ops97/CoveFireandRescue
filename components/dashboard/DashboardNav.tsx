"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/site/Button";
import { useAuth } from "@/hooks/useAuth";
import { canManageContent } from "@/lib/auth/roles";
import {
  getVisibleDashboardNavItems,
  isDashboardNavItemActive,
} from "@/lib/config/dashboard-modules";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading, signOutUser } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  if (loading || !user || !profile) {
    return null;
  }

  const isAdmin = canManageContent(role);
  const navItems = getVisibleDashboardNavItems(isAdmin);
  const onDashboardHome = pathname === "/dashboard";
  const displayName = profile.displayName?.trim() || user.email || "Member";

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
    `inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 ${
      active
        ? "bg-white text-navy-900"
        : "text-white/90 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="sticky top-[74px] z-40 border-b border-navy-800 bg-navy-900 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {!onDashboardHome && (
              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
              >
                <span aria-hidden>←</span>
                <span className="hidden sm:inline">Back to dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
            )}
            <p className="truncate text-sm text-white/75">
              <span className="hidden sm:inline">Signed in as </span>
              <span className="font-semibold text-white">{displayName}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 lg:hidden"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((open) => !open)}
            >
              {toolsOpen ? "Hide tools" : "All tools"}
            </button>
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
        </div>

        <nav
          aria-label="Dashboard tools"
          className={`border-t border-white/10 pb-3 pt-2 ${
            toolsOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const active = isDashboardNavItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(active)}
                  onClick={() => setToolsOpen(false)}
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

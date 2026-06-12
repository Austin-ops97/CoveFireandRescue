"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { canAccessDashboard } from "@/lib/auth/roles";
import { mainNavLinks } from "@/lib/config/navigation";

export function Header() {
  const pathname = usePathname();
  const { user, role, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = useMemo(() => {
    if (loading || !user || !canAccessDashboard(role)) {
      return mainNavLinks;
    }

    return mainNavLinks.map((link) =>
      link.href === "/login"
        ? { href: "/dashboard", label: "Dashboard", cta: true }
        : link
    );
  }, [loading, user, role]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navLinkClass = (href: string, cta?: boolean) => {
    if (cta) {
      return `ml-1 inline-flex min-h-10 items-center rounded-[10px] border border-navy-900 bg-navy-900 px-3 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:border-navy-800 hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2`;
    }
    return `rounded-[10px] px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40 focus-visible:ring-offset-2 ${
      isActive(href)
        ? "bg-[#EEF2FF] text-blue-700"
        : "text-text-dark hover:bg-gray-100 hover:text-navy-900"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40 focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt="Cove Fire & Rescue — Chambers County volunteer fire department"
            width={92}
            height={92}
            className="h-[3.74rem] w-auto shrink-0 sm:h-[4.31rem]"
            priority
            unoptimized
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-navy-900 sm:text-lg">
              Cove Fire &amp; Rescue
            </p>
            <p className="hidden text-xs font-semibold text-gray-500 sm:block">
              Chambers County · Volunteer Department
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(link.href, link.cta)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[10px] p-2 text-navy-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40 focus-visible:ring-offset-2 lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="sr-only">{mobileOpen ? "Close" : "Menu"}</span>
          {mobileOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-[74px] z-40 bg-black/25 backdrop-blur-[1px] lg:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-menu"
            className="fixed left-0 right-0 top-[74px] z-50 max-h-[calc(100dvh-74px)] overflow-y-auto border-t border-gray-200 bg-white shadow-lg lg:hidden"
            aria-label="Mobile navigation"
          >
            <ul className="flex flex-col gap-1 p-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block min-h-11 rounded-[10px] px-4 py-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40 ${
                      link.cta
                        ? "border border-navy-900 bg-navy-900 font-bold text-white hover:border-navy-800 hover:bg-navy-800"
                        : isActive(link.href)
                          ? "bg-[#EEF2FF] text-blue-700"
                          : "text-text-dark hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

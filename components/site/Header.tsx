"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNavLinks } from "@/lib/config/navigation";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-red text-sm font-bold text-white"
            aria-hidden
          >
            CF
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-brand-charcoal sm:text-lg">
              Cove Fire &amp; Rescue
            </p>
            <p className="hidden text-xs text-brand-gray sm:block">
              Community Fire &amp; Rescue
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {mainNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-brand-red/10 text-brand-red"
                  : "text-brand-charcoal hover:bg-brand-gray-light"
              } ${link.href === "/login" ? "text-brand-red font-semibold" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-brand-charcoal hover:bg-brand-gray-light lg:hidden"
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
            className="fixed inset-0 top-[57px] z-40 bg-black/30 lg:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-menu"
            className="fixed left-0 right-0 top-[57px] z-50 max-h-[calc(100vh-57px)] overflow-y-auto border-t border-gray-200 bg-white lg:hidden"
            aria-label="Mobile navigation"
          >
            <ul className="flex flex-col p-4">
              {mainNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-md px-4 py-3 text-base font-medium ${
                      isActive(link.href)
                        ? "bg-brand-red/10 text-brand-red"
                        : "text-brand-charcoal hover:bg-brand-gray-light"
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

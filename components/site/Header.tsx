"use client";

import Image from "next/image";
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

  const navLinkClass = (href: string, cta?: boolean) => {
    if (cta) {
      return `ml-1 inline-flex min-h-10 items-center rounded-lg border-2 border-brand-gold bg-white px-3 py-2 text-sm font-semibold text-brand-blue shadow-sm transition-colors hover:bg-brand-gold hover:text-brand-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus-visible:ring-offset-2 ${
        isActive(href) ? "bg-brand-gold/20" : ""
      }`;
    }
    return `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 ${
      isActive(href)
        ? "bg-brand-blue/10 text-brand-blue"
        : "text-brand-charcoal hover:bg-brand-gray-light hover:text-brand-blue"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-brand-gold bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt="Cove Fire & Rescue — Chambers County volunteer fire department"
            width={80}
            height={80}
            className="h-[3.25rem] w-auto shrink-0 sm:h-[3.75rem]"
            priority
            unoptimized
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-brand-blue sm:text-lg">
              Cove Fire &amp; Rescue
            </p>
            <p className="hidden text-xs font-semibold text-brand-gold-muted sm:block">
              Chambers County · Volunteer Department
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {mainNavLinks.map((link) => (
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
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg p-2 text-brand-blue transition-colors hover:bg-brand-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 lg:hidden"
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
            className="fixed inset-0 top-[65px] z-40 bg-black/25 backdrop-blur-[1px] lg:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-menu"
            className="fixed left-0 right-0 top-[65px] z-50 max-h-[calc(100dvh-65px)] overflow-y-auto border-t border-brand-gold/40 bg-white shadow-lg lg:hidden"
            aria-label="Mobile navigation"
          >
            <ul className="flex flex-col gap-1 p-3">
              {mainNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block min-h-11 rounded-lg px-4 py-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
                      link.cta
                        ? "border-2 border-brand-gold bg-brand-gold/10 font-semibold text-brand-blue hover:bg-brand-gold hover:text-brand-charcoal"
                        : isActive(link.href)
                          ? "bg-brand-blue/10 text-brand-blue"
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

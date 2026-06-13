"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { footerQuickLinks } from "@/lib/config/navigation";
import { siteConfig } from "@/lib/config/site";

const currentYear = new Date().getFullYear();

function DashboardMobileFooter() {
  return (
    <footer className="border-t border-navy-800 bg-navy-900 text-gray-300 safe-area-bottom md:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-xs">
        <p className="text-gray-400">
          &copy; {currentYear} {siteConfig.name}
        </p>
        <p className="font-bold text-white">
          Emergencies:{" "}
          <a href="tel:911" className="text-gold-500 hover:text-gold-400">
            911
          </a>
        </p>
      </div>
    </footer>
  );
}

function PublicMobileFooter() {
  const { contact, social } = siteConfig;

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt=""
          width={48}
          height={48}
          className="h-9 w-auto shrink-0"
          unoptimized
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{siteConfig.name}</p>
          <p className="text-xs text-gold-500">Chambers County · Volunteer FD</p>
        </div>
      </div>

      <p className="mt-3 inline-flex rounded-lg border border-red-700/50 bg-red-700/20 px-2.5 py-1 text-xs font-bold text-white">
        Emergencies: call 911
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <a href={`tel:${contact.publicPhoneTel}`} className="font-medium hover:text-white">
          {contact.publicPhone}
        </a>
        <a href={`mailto:${contact.publicEmail}`} className="hover:text-white">
          Email
        </a>
        <Link href="/contact" className="hover:text-white">
          Contact
        </Link>
        <Link href="/join" className="hover:text-white">
          Join Us
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
        <a
          href={social.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
        >
          Facebook
        </a>
        {footerQuickLinks.slice(0, 4).map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function DesktopFooter() {
  const { contact, social } = siteConfig;

  return (
    <div className="hidden md:block">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Image
            src="/logo.png"
            alt="Cove Fire & Rescue logo"
            width={72}
            height={72}
            className="mb-4 h-16 w-auto"
            unoptimized
          />
          <p className="text-lg font-bold text-white">{siteConfig.name}</p>
          <p className="mt-0.5 text-sm font-semibold text-gold-500">Chambers County, Texas</p>
          <p className="mt-0.5 text-sm text-gray-300">Volunteer Fire Department</p>
          <p className="mt-4 rounded-[10px] border border-red-700/50 bg-red-700/20 px-3 py-2 text-sm font-bold text-white">
            For emergencies, call 911
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <address className="not-italic">{contact.address.full}</address>
            </li>
            <li>
              <a href={`tel:${contact.publicPhoneTel}`} className="transition-colors hover:text-white">
                {contact.publicPhone}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.publicEmail}`} className="transition-colors hover:text-white">
                {contact.publicEmail}
              </a>
            </li>
            <li className="pt-2">
              <span className="font-semibold text-gold-500">Station Hours</span>
              <ul className="mt-1 space-y-0.5 text-gray-300">
                {siteConfig.hours.schedule.map((entry) => (
                  <li key={entry.day}>
                    {entry.day}: {entry.hours}
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500">Connect</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href={social.googleBusiness}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                Google Business Profile
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500">Quick Links</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {footerQuickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-400">
        &copy; {currentYear} {siteConfig.name}. All rights reserved. · {siteConfig.yearsInService}{" "}
        years serving Chambers County
      </div>
    </div>
  );
}

export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <>
        <DashboardMobileFooter />
        <footer className="hidden border-t border-navy-800 bg-navy-900 text-gray-200 safe-area-bottom md:block">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
            <DesktopFooter />
          </div>
        </footer>
      </>
    );
  }

  return (
    <footer className="border-t border-navy-800 bg-navy-900 text-gray-200 safe-area-bottom">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 md:py-12 lg:px-8">
        <PublicMobileFooter />
        <DesktopFooter />
        <div className="mt-4 border-t border-white/10 pt-3 text-center text-xs text-gray-400 md:hidden">
          &copy; {currentYear} {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

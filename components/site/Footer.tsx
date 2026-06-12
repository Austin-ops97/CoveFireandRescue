import Image from "next/image";
import Link from "next/link";
import { footerQuickLinks } from "@/lib/config/navigation";
import { siteConfig } from "@/lib/config/site";

const currentYear = new Date().getFullYear();

export function Footer() {
  const { contact, social } = siteConfig;

  return (
    <footer className="border-t border-navy-800 bg-navy-900 text-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 sm:gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3 sm:block lg:col-span-1">
            <Image
              src="/logo.png"
              alt="Cove Fire & Rescue logo"
              width={72}
              height={72}
              className="h-12 w-auto shrink-0 sm:mb-4 sm:h-16"
              unoptimized
            />
            <div className="min-w-0">
              <p className="text-base font-bold text-white sm:text-lg">{siteConfig.name}</p>
              <p className="mt-0.5 text-sm font-semibold text-gold-500">Chambers County, Texas</p>
              <p className="mt-0.5 text-sm text-gray-300">Volunteer Fire Department</p>
              <p className="mt-2 rounded-[10px] border border-red-700/50 bg-red-700/20 px-3 py-1.5 text-xs font-bold text-white sm:mt-4 sm:py-2 sm:text-sm">
                For emergencies, call 911
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500">
              Contact
            </h3>
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
                <a
                  href={`mailto:${contact.publicEmail}`}
                  className="transition-colors hover:text-white"
                >
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

          <div className="grid grid-cols-2 gap-6 sm:contents">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500">
              Connect
            </h3>
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500">
              Quick Links
            </h3>
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
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-gray-400 sm:mt-10 sm:pt-6">
          &copy; {currentYear} {siteConfig.name}. All rights reserved. · {siteConfig.yearsInService}{" "}
          years serving Chambers County
        </div>
      </div>
    </footer>
  );
}

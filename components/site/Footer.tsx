import Image from "next/image";
import Link from "next/link";
import { footerQuickLinks } from "@/lib/config/navigation";
import { siteConfig } from "@/lib/config/site";

const currentYear = new Date().getFullYear();

export function Footer() {
  const { contact, social } = siteConfig;

  return (
    <footer className="border-t border-navy-800 bg-navy-900 text-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
            <p className="mt-1 text-sm font-semibold text-gold-500">Chambers County, Texas</p>
            <p className="mt-1 text-sm text-gray-300">Volunteer Fire Department</p>
            <p className="mt-4 rounded-[10px] border border-red-700/50 bg-red-700/20 px-3 py-2 text-sm font-bold text-white">
              For emergencies, call 911
            </p>
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
                <p className="mt-2 text-xs leading-relaxed text-gray-400">{siteConfig.hours.note}</p>
              </li>
            </ul>
          </div>

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

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-400">
          &copy; {currentYear} {siteConfig.name}. All rights reserved. · {siteConfig.yearsInService}{" "}
          years serving Chambers County
        </div>
      </div>
    </footer>
  );
}

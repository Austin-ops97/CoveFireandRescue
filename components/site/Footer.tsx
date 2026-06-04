import Link from "next/link";
import { footerQuickLinks } from "@/lib/config/navigation";
import { siteConfig } from "@/lib/config/site";

const currentYear = new Date().getFullYear();

export function Footer() {
  const { contact, social, tagline } = siteConfig;

  return (
    <footer className="border-t-4 border-brand-gold bg-brand-blue text-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="text-lg font-bold text-white">{siteConfig.name}</p>
            <p className="mt-1 text-sm font-semibold text-brand-gold">{tagline}</p>
            <p className="mt-3 text-sm leading-relaxed">
              {siteConfig.mission.slice(0, 120)}…
            </p>
            <p className="mt-4 rounded-md border border-brand-red/50 bg-brand-red/25 px-3 py-2 text-sm font-semibold text-white">
              Emergency: Call 911
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <address className="not-italic">{contact.address.full}</address>
              </li>
              <li>
                <a href={`tel:${contact.publicPhoneTel}`} className="hover:text-white transition-colors">
                  {contact.publicPhone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.publicEmail}`}
                  className="hover:text-white transition-colors"
                >
                  {contact.publicEmail}
                </a>
              </li>
              <li className="pt-2">
                <span className="font-semibold text-brand-gold">Station Hours</span>
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Connect
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href={social.googleBusiness}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Google Business Profile
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Quick Links
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {footerQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-center text-xs text-gray-400">
          &copy; {currentYear} {siteConfig.name}. All rights reserved. · {siteConfig.yearsInService}{" "}
          years serving Chambers County
        </div>
      </div>
    </footer>
  );
}

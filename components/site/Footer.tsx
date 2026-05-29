import Link from "next/link";
import { footerQuickLinks } from "@/lib/config/navigation";

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-brand-charcoal text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-white">Cove Fire &amp; Rescue</p>
            <p className="mt-3 text-sm leading-relaxed">
              Serving our community with readiness, professionalism, and pride.
            </p>
            <p className="mt-4 rounded-md border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm font-semibold text-white">
              Emergency: Call 911
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Non-Emergency Contact
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Station Address — Coming Soon</li>
              <li>Phone — (555) 000-0000</li>
              <li>
                <a
                  href="mailto:info@covefirerescue.org"
                  className="hover:text-white transition-colors"
                >
                  info@covefirerescue.org
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Quick Links
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-1">
              {footerQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          &copy; {currentYear} Cove Fire &amp; Rescue. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

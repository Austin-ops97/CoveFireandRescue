export interface NavLink {
  href: string;
  label: string;
  /** Render as a nav CTA button (e.g. Member Login) */
  cta?: boolean;
}

export const mainNavLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/leadership", label: "Leadership" },
  { href: "/fleet", label: "Fleet" },
  { href: "/announcements", label: "Updates" },
  { href: "/join", label: "Join Us" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Member Login", cta: true },
];

export const footerQuickLinks: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/leadership", label: "Leadership" },
  { href: "/fleet", label: "Fleet" },
  { href: "/announcements", label: "Updates" },
  { href: "/gallery", label: "Gallery" },
  { href: "/join", label: "Join Us" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Member Login" },
];

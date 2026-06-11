export interface NavLink {
  href: string;
  label: string;
  /** Render as a nav CTA button (e.g. Member Login) */
  cta?: boolean;
}

export const mainNavLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/leadership", label: "Leadership" },
  { href: "/fleet", label: "Fleet" },
  { href: "/announcements", label: "Updates" },
  { href: "/join", label: "Join Us" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Member Login", cta: true },
];

export const footerQuickLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/leadership", label: "Leadership" },
  { href: "/fleet", label: "Fleet" },
  { href: "/gallery", label: "Gallery" },
  { href: "/announcements", label: "Updates" },
  { href: "/join", label: "Join Us" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Member Login" },
];

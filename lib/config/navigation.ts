export interface NavLink {
  href: string;
  label: string;
}

export const mainNavLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/leadership", label: "Leadership" },
  { href: "/fleet", label: "Fleet" },
  { href: "/announcements", label: "Announcements" },
  { href: "/join", label: "Join" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Member Login" },
];

export const footerQuickLinks: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/fleet", label: "Fleet" },
  { href: "/announcements", label: "Announcements" },
  { href: "/join", label: "Join Us" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Member Login" },
];

export type ModuleStatus = "active" | "coming_soon" | "admin_only";

export type DashboardModule = {
  title: string;
  /** Shorter label for the dashboard navigation bar */
  navLabel?: string;
  description: string;
  href?: string;
  status: ModuleStatus;
  /** When true, nav highlight only matches this path exactly (not child routes). */
  exactNavMatch?: boolean;
};

export type ModuleGroup = {
  id: string;
  title: string;
  description?: string;
  modules: DashboardModule[];
  adminOnly?: boolean;
};

export const dashboardModuleGroups: ModuleGroup[] = [
  {
    id: "operations",
    title: "Operations",
    description: "Digital rounds, inspections, and review workflows.",
    modules: [
      {
        title: "Digital Rounds / Checklists",
        navLabel: "Submit checklist",
        description: "Complete apparatus, station, equipment, and custom inspection checklists.",
        href: "/dashboard/rounds",
        status: "active",
        exactNavMatch: true,
      },
      {
        title: "Checklist History",
        navLabel: "History",
        description: "View submitted inspections and attached photos.",
        href: "/dashboard/rounds/history",
        status: "active",
      },
      {
        title: "Checklist Review",
        navLabel: "Review",
        description: "Review submissions and highlight failed or negative answers.",
        href: "/dashboard/rounds/review",
        status: "admin_only",
      },
      {
        title: "Checklist Templates",
        navLabel: "Templates",
        description: "Build reusable inspection sheets with sections and custom fields.",
        href: "/dashboard/checklist-templates",
        status: "admin_only",
      },
      {
        title: "Checklist Notifications",
        navLabel: "Notifications",
        description: "Review and acknowledge new checklist submission alerts.",
        href: "/dashboard/rounds/notifications",
        status: "admin_only",
      },
      {
        title: "Submission Trash",
        navLabel: "Trash",
        description: "Restore or permanently delete soft-deleted submissions.",
        href: "/dashboard/rounds/trash",
        status: "admin_only",
      },
      {
        title: "Checklist Audit Log",
        navLabel: "Audit log",
        description: "Accountability history for submissions and notifications.",
        href: "/dashboard/rounds/audit",
        status: "admin_only",
      },
    ],
  },
  {
    id: "content",
    title: "Content Management",
    description: "Public-facing department content and apparatus records.",
    adminOnly: true,
    modules: [
      {
        title: "Announcements Manager",
        navLabel: "Announcements",
        description: "Publish and manage public announcements.",
        href: "/dashboard/announcements",
        status: "admin_only",
      },
      {
        title: "Fleet Manager",
        navLabel: "Fleet",
        description: "Manage apparatus details, photos, and equipment.",
        href: "/dashboard/fleet",
        status: "admin_only",
      },
      {
        title: "Leadership Manager",
        navLabel: "Leadership",
        description: "Update command staff profiles and photos.",
        href: "/dashboard/leadership",
        status: "admin_only",
      },
      {
        title: "Gallery Manager",
        navLabel: "Gallery",
        description: "Manage public photo gallery images.",
        href: "/dashboard/gallery",
        status: "admin_only",
      },
      {
        title: "Volunteer Applications",
        navLabel: "Applications",
        description: "Review applications from the public Join Us page.",
        href: "/dashboard/applications",
        status: "admin_only",
      },
      {
        title: "Contact Submissions",
        navLabel: "Contact",
        description: "Review messages from the public contact form.",
        href: "/dashboard/contact-submissions",
        status: "admin_only",
      },
    ],
  },
  {
    id: "users",
    title: "User / Admin",
    description: "Member access and role management.",
    adminOnly: true,
    modules: [
      {
        title: "Manage Users",
        navLabel: "Users",
        description: "Create accounts, assign roles, and control member access.",
        href: "/dashboard/users",
        status: "admin_only",
      },
    ],
  },
  {
    id: "system",
    title: "System",
    description: "Department files, training records, and equipment inventory.",
    adminOnly: true,
    modules: [
      {
        title: "File Storage",
        navLabel: "File library",
        description: "Folder-based file manager with Backblaze B2 storage.",
        href: "/dashboard/file-library",
        status: "admin_only",
      },
      {
        title: "Training Records",
        navLabel: "Training",
        description: "Member training hours and certifications.",
        href: "/dashboard/training-records",
        status: "admin_only",
      },
      {
        title: "Equipment Tracking",
        navLabel: "Equipment",
        description: "Inventory and maintenance for tools and gear.",
        href: "/dashboard/equipment-tracking",
        status: "admin_only",
      },
    ],
  },
];

export type DashboardNavItem = {
  label: string;
  href: string;
  exactNavMatch?: boolean;
};

export function getVisibleDashboardNavItems(role: string | null | undefined): DashboardNavItem[] {
  const isAdmin = role === "admin";
  const items: DashboardNavItem[] = [{ label: "Dashboard", href: "/dashboard" }];

  for (const group of dashboardModuleGroups) {
    if (group.adminOnly && !isAdmin) continue;

    for (const entry of group.modules) {
      if (!entry.href || entry.status === "coming_soon") continue;
      if (entry.status === "admin_only" && !isAdmin) continue;

      items.push({
        label: entry.navLabel ?? entry.title,
        href: entry.href,
        exactNavMatch: entry.exactNavMatch,
      });
    }
  }

  return items;
}

export function isDashboardNavItemActive(
  pathname: string,
  item: DashboardNavItem
): boolean {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (item.exactNavMatch) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export type DashboardNavGroup = {
  id: string;
  title: string;
  items: DashboardNavItem[];
};

export function getGroupedDashboardNavItems(
  role: string | null | undefined
): DashboardNavGroup[] {
  const isAdmin = role === "admin";
  const groups: DashboardNavGroup[] = [
    {
      id: "home",
      title: "Home",
      items: [{ label: "Dashboard", href: "/dashboard" }],
    },
  ];

  for (const group of dashboardModuleGroups) {
    if (group.adminOnly && !isAdmin) continue;

    const items: DashboardNavItem[] = [];

    for (const entry of group.modules) {
      if (!entry.href || entry.status === "coming_soon") continue;
      if (entry.status === "admin_only" && !isAdmin) continue;

      items.push({
        label: entry.navLabel ?? entry.title,
        href: entry.href,
        exactNavMatch: entry.exactNavMatch,
      });
    }

    if (items.length > 0) {
      groups.push({
        id: group.id,
        title: group.title,
        items,
      });
    }
  }

  return groups;
}

"use client";

import Link from "next/link";
import { ModuleStatusBadge } from "@/components/dashboard/ModuleStatusBadge";
import { DashboardSection } from "@/components/dashboard/home/DashboardStatCard";
import { Card } from "@/components/site/Card";
import { useAuth } from "@/hooks/useAuth";
import { canManageContent } from "@/lib/auth/roles";

type ModuleStatus = "active" | "coming_soon" | "admin_only";

type DashboardModule = {
  title: string;
  description: string;
  href?: string;
  status: ModuleStatus;
};

type ModuleGroup = {
  id: string;
  title: string;
  description?: string;
  modules: DashboardModule[];
  adminOnly?: boolean;
};

const moduleGroups: ModuleGroup[] = [
  {
    id: "operations",
    title: "Operations",
    description: "Digital rounds, inspections, and review workflows.",
    modules: [
      {
        title: "Digital Rounds / Checklists",
        description: "Complete apparatus, station, equipment, and custom inspection checklists.",
        href: "/dashboard/rounds",
        status: "active",
      },
      {
        title: "Checklist History",
        description: "View submitted inspections and attached photos.",
        href: "/dashboard/rounds/history",
        status: "active",
      },
      {
        title: "Checklist Review",
        description: "Review submissions and highlight failed or negative answers.",
        href: "/dashboard/rounds/review",
        status: "admin_only",
      },
      {
        title: "Checklist Templates",
        description: "Build reusable inspection sheets with sections and custom fields.",
        href: "/dashboard/checklist-templates",
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
        description: "Publish and manage public announcements.",
        href: "/dashboard/announcements",
        status: "admin_only",
      },
      {
        title: "Fleet Manager",
        description: "Manage apparatus details, photos, and equipment.",
        href: "/dashboard/fleet",
        status: "admin_only",
      },
      {
        title: "Leadership Manager",
        description: "Update command staff profiles and photos.",
        href: "/dashboard/leadership",
        status: "admin_only",
      },
      {
        title: "Gallery Manager",
        description: "Manage public photo gallery images.",
        href: "/dashboard/gallery",
        status: "admin_only",
      },
      {
        title: "Volunteer Applications",
        description: "Review applications from the public Join Us page.",
        href: "/dashboard/applications",
        status: "admin_only",
      },
      {
        title: "Contact Submissions",
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
        description: "Folder-based file manager with Backblaze B2 storage.",
        href: "/dashboard/file-library",
        status: "admin_only",
      },
      {
        title: "Training Records",
        description: "Member training hours and certifications.",
        href: "/dashboard/training-records",
        status: "admin_only",
      },
      {
        title: "Equipment Tracking",
        description: "Inventory and maintenance for tools and gear.",
        href: "/dashboard/equipment-tracking",
        status: "admin_only",
      },
    ],
  },
];

function ModuleCard({ module }: { module: DashboardModule }) {
  const card = (
    <Card
      hover={Boolean(module.href)}
      className={`group flex h-full flex-col ${!module.href ? "opacity-90" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-brand-charcoal transition-colors duration-150 group-hover:text-brand-blue">
          {module.title}
        </h3>
        <ModuleStatusBadge status={module.status} />
      </div>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-brand-gray">{module.description}</p>
      {module.href ? (
        <span className="mt-5 inline-flex items-center text-sm font-semibold text-brand-blue">
          Open module
          <span
            className="ml-1 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </span>
      ) : null}
    </Card>
  );

  if (module.href) {
    return (
      <Link
        href={module.href}
        className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    );
  }

  return card;
}

function ModuleGrid({ modules }: { modules: DashboardModule[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {modules.map((module) => (
        <ModuleCard key={module.title} module={module} />
      ))}
    </div>
  );
}

export function DashboardModules() {
  const { role } = useAuth();
  const isAdmin = canManageContent(role);

  const visibleGroups = moduleGroups
    .filter((group) => !group.adminOnly || isAdmin)
    .map((group) => ({
      ...group,
      modules: group.modules.filter((module) => {
        if (module.status === "admin_only" && !isAdmin) return false;
        if (module.status === "coming_soon" && !isAdmin) return false;
        return true;
      }),
    }))
    .filter((group) => group.modules.length > 0);

  return (
    <div className="space-y-10">
      {visibleGroups.map((group) => (
        <DashboardSection
          key={group.id}
          title={group.title}
          description={group.description}
        >
          <ModuleGrid modules={group.modules} />
        </DashboardSection>
      ))}
    </div>
  );
}

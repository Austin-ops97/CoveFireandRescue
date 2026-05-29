"use client";

import Link from "next/link";
import { ModuleStatusBadge } from "@/components/dashboard/ModuleStatusBadge";
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

const dashboardModules: DashboardModule[] = [
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
    title: "File Library",
    description: "Department documents and uploaded files (Backblaze B2).",
    status: "coming_soon",
  },
  {
    title: "Training Records",
    description: "Member training hours and certifications.",
    status: "coming_soon",
  },
  {
    title: "Equipment Tracking",
    description: "Inventory and maintenance for tools and gear.",
    status: "coming_soon",
  },
  {
    title: "User Access",
    description: "Manage member accounts, roles, and active status.",
    href: "/dashboard/users",
    status: "admin_only",
  },
];

export function DashboardModules() {
  const { role } = useAuth();
  const isAdmin = canManageContent(role);

  const visibleModules = dashboardModules.filter((module) => {
    if (module.status === "admin_only" && !isAdmin) return false;
    return true;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {visibleModules.map((module) => {
        const card = (
          <Card
            hover={Boolean(module.href)}
            className={`group flex h-full flex-col ${!module.href ? "opacity-90" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-brand-charcoal group-hover:text-brand-red transition-colors duration-150">
                {module.title}
              </h3>
              <ModuleStatusBadge status={module.status} />
            </div>
            <p className="mt-2.5 flex-1 text-sm leading-relaxed text-brand-gray">
              {module.description}
            </p>
            {module.href && (
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-brand-red">
                Open module
                <span className="ml-1 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </span>
            )}
          </Card>
        );

        if (module.href) {
          return (
            <Link key={module.title} href={module.href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2">
              {card}
            </Link>
          );
        }

        return <div key={module.title}>{card}</div>;
      })}
    </div>
  );
}

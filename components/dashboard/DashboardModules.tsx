"use client";

import Link from "next/link";
import { ModuleStatusBadge } from "@/components/dashboard/ModuleStatusBadge";
import { DashboardSection } from "@/components/dashboard/home/DashboardStatCard";
import { Card } from "@/components/site/Card";
import { useAuth } from "@/hooks/useAuth";
import { canManageContent } from "@/lib/auth/roles";
import {
  dashboardModuleGroups,
  type DashboardModule,
} from "@/lib/config/dashboard-modules";

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

  const visibleGroups = dashboardModuleGroups
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

import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardModules } from "@/components/dashboard/DashboardModules";
import { DashboardSection } from "@/components/dashboard/home/DashboardStatCard";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Cove Fire & Rescue member and admin dashboard.",
};

export default function DashboardPage() {
  return (
    <RequireAuth allowedRoles={["admin", "member"]}>
      <PageShell
        title="Member Dashboard"
        description="Internal tools for Cove Fire & Rescue members and administrators."
      >
        <div className="space-y-12">
          <DashboardHome />
          <DashboardSection
            title="Modules"
            description="Browse all tools available for your role."
          >
            <DashboardModules />
          </DashboardSection>
        </div>
      </PageShell>
    </RequireAuth>
  );
}

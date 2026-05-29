import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardModules } from "@/components/dashboard/DashboardModules";
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
        <DashboardModules />
      </PageShell>
    </RequireAuth>
  );
}

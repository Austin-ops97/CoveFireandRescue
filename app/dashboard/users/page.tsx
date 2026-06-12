import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { UserAccessManager } from "@/components/dashboard/UserAccessManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Manage Users",
  description: "Create and manage Cove Fire & Rescue portal accounts and access levels.",
};

export default function UserAccessPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Manage Users"
        description="Create portal accounts, assign roles, and control member access."
      >
        <UserAccessManager />
      </PageShell>
    </RequireAuth>
  );
}

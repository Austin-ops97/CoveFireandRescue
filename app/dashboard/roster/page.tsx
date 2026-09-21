import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RosterManager } from "@/components/dashboard/RosterManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Department Roster",
  description: "View, maintain, print, and export the Cove Fire & Rescue member roster.",
};

export default function RosterDashboardPage() {
  return (
    <RequireAuth allowedRoles={["admin", "editor", "viewer", "member"]}>
      <PageShell
        title="Roster"
        description="Department roster for officers and members. Not visible to the public. Admins and editors can add, edit, and remove members."
      >
        <RosterManager />
      </PageShell>
    </RequireAuth>
  );
}

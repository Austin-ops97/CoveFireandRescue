import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RosterManager } from "@/components/dashboard/RosterManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Department Roster",
  description: "View, maintain, print, and export the Cove Fire & Rescue member roster.",
};

export default function RosterPage() {
  return (
    <RequireAuth allowedRoles={["admin", "editor", "viewer", "member"]}>
      <PageShell
        title="Department Roster"
        description="Centralized member roster for viewing, maintenance, printing, and export."
      >
        <RosterManager />
      </PageShell>
    </RequireAuth>
  );
}

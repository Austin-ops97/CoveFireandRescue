import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { LeadershipManager } from "@/components/dashboard/LeadershipManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Leadership Manager",
  description:
    "Manage command staff, high-ups, bios, and public leadership visibility.",
};

export default function LeadershipManagerPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Leadership Manager"
        description="Manage command staff, high-ups, bios, and public leadership visibility."
      >
        <LeadershipManager />
      </PageShell>
    </RequireAuth>
  );
}

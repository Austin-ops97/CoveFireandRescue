import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApplicationsManager } from "@/components/dashboard/ApplicationsManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Volunteer Applications",
  description: "Review volunteer applications submitted from the public Join Us page.",
};

export default function ApplicationsDashboardPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Volunteer Applications"
        description="Applications submitted from the public Join Us page. Not visible to the public."
      >
        <ApplicationsManager />
      </PageShell>
    </RequireAuth>
  );
}

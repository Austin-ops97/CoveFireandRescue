import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChecklistSubmissionsExplorer } from "@/components/dashboard/ChecklistSubmissionsExplorer";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Checklist History",
  description: "View submitted digital rounds and inspection checklists.",
};

export default function ChecklistHistoryPage() {
  return (
    <RequireAuth allowedRoles={["admin", "member"]}>
      <PageShell
        title="Checklist History"
        description="Review submitted checklists. Members see their own submissions; administrators can view all department submissions."
      >
        <ChecklistSubmissionsExplorer mode="history" />
      </PageShell>
    </RequireAuth>
  );
}

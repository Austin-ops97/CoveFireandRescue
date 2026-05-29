import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChecklistSubmissionsExplorer } from "@/components/dashboard/ChecklistSubmissionsExplorer";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Checklist Review",
  description: "Review submitted digital rounds and inspection checklists.",
};

export default function ChecklistReviewPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Checklist Review"
        description="Review recent submissions, highlight failed or negative answers, and inspect attached photos. Maintenance ticketing is not enabled yet."
      >
        <ChecklistSubmissionsExplorer mode="review" />
      </PageShell>
    </RequireAuth>
  );
}

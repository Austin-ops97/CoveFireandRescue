import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChecklistSubmissionForm } from "@/components/dashboard/ChecklistSubmissionForm";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Digital Rounds & Checklists",
  description:
    "Complete digital apparatus checks, station rounds, equipment inspections, and custom department checklists.",
};

export default function DigitalRoundsPage() {
  return (
    <RequireAuth allowedRoles={["admin", "member"]}>
      <PageShell
        title="Digital Rounds & Checklists"
        description="Select a reusable checklist template, complete the inspection, attach photos, and submit."
      >
        <ChecklistSubmissionForm />
      </PageShell>
    </RequireAuth>
  );
}

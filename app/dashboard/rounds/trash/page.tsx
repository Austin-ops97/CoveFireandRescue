import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChecklistSubmissionTrash } from "@/components/dashboard/checklist/ChecklistSubmissionTrash";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Submission Trash",
  description: "Restore or permanently delete soft-deleted checklist submissions.",
};

export default function ChecklistSubmissionTrashPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Submission Trash"
        description="Deleted checklist submissions are kept here for recovery. Restore items or permanently purge them when no longer needed."
      >
        <ChecklistSubmissionTrash />
      </PageShell>
    </RequireAuth>
  );
}

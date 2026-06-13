import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChecklistAuditLogPanel } from "@/components/dashboard/checklist/ChecklistAuditLogPanel";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Checklist Audit Log",
  description: "Audit history for checklist submissions and notifications.",
};

export default function ChecklistAuditLogPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Checklist Audit Log"
        description="Review accountability records for submission creation, deletion, restoration, and notification acknowledgement."
      >
        <ChecklistAuditLogPanel />
      </PageShell>
    </RequireAuth>
  );
}

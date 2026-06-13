import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChecklistNotificationsPanel } from "@/components/dashboard/checklist/ChecklistNotificationsPanel";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Checklist Notifications",
  description: "Review and acknowledge checklist submission notifications.",
};

export default function ChecklistNotificationsPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Checklist Notifications"
        description="Review new checklist submissions, acknowledge notifications, and track notification history."
      >
        <ChecklistNotificationsPanel />
      </PageShell>
    </RequireAuth>
  );
}

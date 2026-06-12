import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { TrainingRecordsManager } from "@/components/dashboard/TrainingRecordsManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Training Records",
  description: "Member training hours and certifications.",
};

export default function TrainingRecordsPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Training Records"
        description="Member training hours and certifications."
      >
        <TrainingRecordsManager />
      </PageShell>
    </RequireAuth>
  );
}

import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChecklistTemplateBuilder } from "@/components/dashboard/ChecklistTemplateBuilder";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Checklist Template Builder",
  description:
    "Create reusable inspection sheets for apparatus, station checks, equipment, and custom department forms.",
};

export default function ChecklistTemplatesPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Checklist Template Builder"
        description="Create reusable inspection sheets for apparatus, station checks, equipment checks, and custom department forms."
      >
        <ChecklistTemplateBuilder />
      </PageShell>
    </RequireAuth>
  );
}

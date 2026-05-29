import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { FleetManager } from "@/components/dashboard/FleetManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Fleet Manager",
  description:
    "Manage apparatus, vehicles, equipment notes, and public fleet visibility.",
};

export default function FleetManagerPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Fleet Manager"
        description="Manage apparatus, vehicles, equipment notes, and public fleet visibility."
      >
        <FleetManager />
      </PageShell>
    </RequireAuth>
  );
}

import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { EquipmentTrackingManager } from "@/components/dashboard/EquipmentTrackingManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Equipment Tracking",
  description: "Inventory and maintenance for tools and gear.",
};

export default function EquipmentTrackingPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Equipment Tracking"
        description="Inventory and maintenance for tools and gear."
      >
        <EquipmentTrackingManager />
      </PageShell>
    </RequireAuth>
  );
}

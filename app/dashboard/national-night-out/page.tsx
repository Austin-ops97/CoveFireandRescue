import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { NationalNightOutManager } from "@/components/dashboard/NationalNightOutManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "National Night Out Requests",
  description:
    "Enable or disable National Night Out visit requests and review submitted neighborhood event requests.",
};

export default function NationalNightOutDashboardPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="National Night Out Requests"
        description="Review public visit requests for National Night Out. Enable or disable public submissions from this page. Not visible to the public."
      >
        <NationalNightOutManager />
      </PageShell>
    </RequireAuth>
  );
}

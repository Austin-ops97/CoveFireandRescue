import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { GalleryManager } from "@/components/dashboard/GalleryManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Gallery Manager",
  description: "Manage public photo gallery images for Cove Fire & Rescue.",
};

export default function GalleryDashboardPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Gallery Manager"
        description="Add and manage photos shown on the public gallery page."
      >
        <GalleryManager />
      </PageShell>
    </RequireAuth>
  );
}

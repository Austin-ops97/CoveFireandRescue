import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AnnouncementManager } from "@/components/dashboard/AnnouncementManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Announcements Manager",
  description:
    "Manage public billboard posts, burn ban notices, training updates, and department announcements.",
};

export default function AnnouncementsManagerPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Announcements Manager"
        description="Manage public billboard posts, burn ban notices, training updates, and department announcements."
      >
        <AnnouncementManager />
      </PageShell>
    </RequireAuth>
  );
}

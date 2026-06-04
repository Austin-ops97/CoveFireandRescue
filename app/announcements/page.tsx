import type { Metadata } from "next";
import { PublicAnnouncementsFeed } from "@/components/site/PublicAnnouncementsFeed";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Department Updates",
  description:
    "Official department updates, training notices, events, and community announcements from Cove Fire & Rescue.",
};

export default function AnnouncementsPage() {
  return (
    <PageShell
      title="Department Updates"
      description="Official notices, training updates, events, and department news from Cove Fire & Rescue."
    >
      <PublicAnnouncementsFeed />
    </PageShell>
  );
}

import type { Metadata } from "next";
import { PublicAnnouncementsFeed } from "@/components/site/PublicAnnouncementsFeed";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Public announcements and community notices from Cove Fire & Rescue.",
};

export default function AnnouncementsPage() {
  return (
    <PageShell
      title="Announcements & Community Board"
      description="Official notices, training updates, events, and department news from Cove Fire & Rescue."
    >
      <PublicAnnouncementsFeed />
    </PageShell>
  );
}

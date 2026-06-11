import type { Metadata } from "next";
import { PublicGalleryGrid } from "@/components/site/PublicGalleryGrid";
import { PageShell } from "@/components/site/PageShell";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Photos from Cove Fire & Rescue — team, station, apparatus, events, and community service in Cove, Texas.",
  keywords: [...siteConfig.seo.keywords],
};

export default function GalleryPage() {
  return (
    <PageShell
      eyebrow="Department Photos"
      title="Photo Gallery"
      description="Team, station, apparatus, projects, and community photos from Cove Fire & Rescue."
    >
      <PublicGalleryGrid />
    </PageShell>
  );
}

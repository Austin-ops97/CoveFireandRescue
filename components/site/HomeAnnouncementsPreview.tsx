"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import { fetchPublicAnnouncements } from "@/lib/announcements/client";
import { getCategoryLabel } from "@/lib/announcements/types";
import type { AnnouncementRecord } from "@/lib/announcements/types";

function formatPublishedDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function PreviewCard({ announcement }: { announcement: AnnouncementRecord }) {
  const publishedLabel = formatPublishedDate(announcement.publishedAt);
  const excerpt =
    announcement.body.length > 160
      ? `${announcement.body.slice(0, 160).trim()}…`
      : announcement.body;

  return (
    <Card hover className={announcement.pinned ? "ring-2 ring-gold-500/40" : ""}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={getCategoryLabel(announcement.category)} className="bg-gold-100 text-gold-600" />
        {announcement.pinned && (
          <Badge label="Pinned" className="bg-gray-100 text-gray-700" />
        )}
        {publishedLabel && <time className="text-sm text-gray-500">{publishedLabel}</time>}
      </div>
      <h3 className="mt-3 text-lg font-bold text-navy-900">{announcement.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{excerpt}</p>
      <Link
        href="/announcements"
        className="mt-4 inline-block text-sm font-bold text-blue-700 hover:underline"
      >
        Read More →
      </Link>
    </Card>
  );
}

export function HomeAnnouncementsPreview() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchPublicAnnouncements();
        if (!cancelled) setAnnouncements(items.slice(0, 3));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load updates.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-off-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeader
          eyebrow="Department News"
          title="Latest Department Updates"
          subtitle="Recent announcements from Cove Fire & Rescue."
        />

        {loading && <SkeletonCardList count={3} />}

        {error && (
          <AlertBanner variant="error" title="Could not load updates">
            {error}
          </AlertBanner>
        )}

        {!loading && !error && announcements.length === 0 && (
          <EmptyState
            title="No current updates"
            description="No current updates. Please check back soon."
          />
        )}

        {!loading && !error && announcements.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((item) => (
                <PreviewCard key={item.id} announcement={item} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button href="/announcements" variant="primary">
                View All Updates
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

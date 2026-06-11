"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import { fetchPublicAnnouncements } from "@/lib/announcements/client";
import type { AnnouncementRecord } from "@/lib/announcements/types";
import { getCategoryLabel } from "@/lib/announcements/types";

function formatPublishedDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PublicAnnouncementCard({ announcement }: { announcement: AnnouncementRecord }) {
  const publishedLabel = formatPublishedDate(announcement.publishedAt);

  return (
    <Card hover className={announcement.pinned ? "ring-2 ring-gold-500/40" : ""}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={getCategoryLabel(announcement.category)} className="bg-gold-100 text-gold-600" />
        {announcement.pinned && (
          <Badge label="Pinned" className="bg-gray-100 text-gray-700" />
        )}
        {publishedLabel && (
          <time className="text-sm text-gray-500" dateTime={String(announcement.publishedAt)}>
            {publishedLabel}
          </time>
        )}
      </div>
      <h3 className="mt-3 text-lg font-bold text-navy-900">{announcement.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-500">
        {announcement.body}
      </p>
    </Card>
  );
}

export function PublicAnnouncementsFeed() {
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
        if (!cancelled) setAnnouncements(items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load announcements.");
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

  if (loading) {
    return <SkeletonCardList count={4} />;
  }

  if (error) {
    return (
      <AlertBanner variant="error" title="Could not load announcements">
        {error}
      </AlertBanner>
    );
  }

  if (announcements.length === 0) {
    return (
      <EmptyState
        title="No current updates"
        description="No current updates. Please check back soon."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {announcements.map((announcement) => (
        <PublicAnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}

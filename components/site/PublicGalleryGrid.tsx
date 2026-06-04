"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import { galleryCategories } from "@/lib/config/site";
import { fetchPublicGallery } from "@/lib/gallery/client";
import type { GalleryRecord } from "@/lib/gallery/types";
import { getCategoryLabel } from "@/lib/gallery/types";

function GalleryPlaceholder({ category }: { category: string }) {
  const label = galleryCategories.find((c) => c.value === category)?.label ?? "Photo";

  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue/10 via-brand-gray-light to-brand-gold/20 p-6 text-center">
      <span className="text-4xl opacity-40" aria-hidden>
        📷
      </span>
      <p className="mt-3 text-sm font-semibold text-brand-charcoal">{label}</p>
      <p className="mt-1 text-xs text-brand-gray">Photos coming soon</p>
    </div>
  );
}

function GalleryImageCard({ item }: { item: GalleryRecord }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-[4/3] bg-brand-gray-light">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.altText || item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <Badge label={getCategoryLabel(item.category)} className="bg-brand-gray-light text-brand-charcoal" />
        {item.title && <p className="mt-2 text-sm font-semibold text-brand-charcoal">{item.title}</p>}
      </div>
    </Card>
  );
}

const placeholderCategories = galleryCategories.map((c) => c.value);

interface PublicGalleryGridProps {
  preview?: boolean;
  limit?: number;
}

export function PublicGalleryGrid({ preview = false, limit }: PublicGalleryGridProps) {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const loaded = await fetchPublicGallery();
        if (!cancelled) setItems(loaded);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load gallery.");
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
    return <SkeletonCardList count={preview ? 3 : 6} />;
  }

  if (error) {
    return (
      <AlertBanner variant="error" title="Could not load gallery">
        {error}
      </AlertBanner>
    );
  }

  const displayItems = limit ? items.slice(0, limit) : items;

  if (displayItems.length === 0) {
    if (preview) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderCategories.slice(0, 3).map((category) => (
            <Card key={category} className="overflow-hidden p-0">
              <GalleryPlaceholder category={category} />
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <EmptyState
          title="Gallery photos coming soon"
          description="Team, station, apparatus, and community photos will appear here once uploaded by department leadership."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderCategories.map((category) => (
            <Card key={category} className="overflow-hidden p-0">
              <GalleryPlaceholder category={category} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${preview ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {displayItems.map((item) => (
        <GalleryImageCard key={item.id} item={item} />
      ))}
    </div>
  );
}

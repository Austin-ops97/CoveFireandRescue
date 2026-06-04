"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import { fetchPublicFleet } from "@/lib/fleet/client";
import type { FleetUnitRecord } from "@/lib/fleet/types";

function FleetPreviewCard({ unit }: { unit: FleetUnitRecord }) {
  return (
    <Card hover padding="none" className="fleet-card flex h-full flex-col overflow-hidden">
      {unit.primaryImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={unit.primaryImageUrl}
          alt={`${unit.name} apparatus`}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div
          className="flex aspect-video w-full items-center justify-center bg-gray-100 text-gray-500"
          aria-label={`Photo placeholder for ${unit.name}`}
        >
          <span className="text-sm font-medium">Apparatus photo coming soon</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <Badge label={unit.type} className="bg-gold-100 text-gold-600" />
        <h3 className="mt-2 text-lg font-bold text-navy-900">{unit.name}</h3>
        {unit.equipmentNotes ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
            {unit.equipmentNotes.length > 120
              ? `${unit.equipmentNotes.slice(0, 120).trim()}…`
              : unit.equipmentNotes}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export function HomeFleetPreview() {
  const [fleet, setFleet] = useState<FleetUnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchPublicFleet();
        if (!cancelled) setFleet(items.slice(0, 4));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load fleet.");
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
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeader
          eyebrow="Response Equipment"
          title="Apparatus & Response Equipment"
          subtitle="Engines, tankers, rescue units, and support vehicles ready to serve Cove and Chambers County."
        />

        {loading && <SkeletonCardList count={3} />}

        {error && (
          <AlertBanner variant="error" title="Could not load fleet">
            {error}
          </AlertBanner>
        )}

        {!loading && !error && fleet.length === 0 && (
          <EmptyState
            title="Fleet information coming soon"
            description="Apparatus details will be published here as they are added by department leadership."
          />
        )}

        {!loading && !error && fleet.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {fleet.map((unit) => (
                <FleetPreviewCard key={unit.id} unit={unit} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button href="/fleet" variant="secondary">
                View Full Fleet
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonGrid } from "@/components/ui";
import { fetchPublicFleet } from "@/lib/fleet/client";
import type { FleetUnitRecord } from "@/lib/fleet/types";

function formatCapacity(value: number | null | undefined, suffix: string): string | null {
  if (value === null || value === undefined) return null;
  return `${value.toLocaleString()} ${suffix}`;
}

function PublicFleetCard({ unit }: { unit: FleetUnitRecord }) {
  const pumpLabel = formatCapacity(unit.pumpCapacityGpm, "GPM");
  const waterLabel = formatCapacity(unit.waterCapacityGallons, "gal");

  return (
    <Card hover className="flex h-full flex-col">
      {unit.primaryImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={unit.primaryImageUrl}
          alt={`${unit.name} apparatus`}
          className="mb-4 aspect-video w-full rounded-md object-cover"
        />
      ) : (
        <div
          className="mb-4 flex aspect-video w-full items-center justify-center rounded-md bg-brand-charcoal/5 text-brand-gray"
          aria-label={`Photo placeholder for ${unit.name}`}
        >
          <span className="text-sm font-medium">Apparatus photo coming soon</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge label={unit.type} className="bg-brand-gray-light text-brand-charcoal" />
        {unit.unitNumber ? (
          <span className="text-sm font-semibold text-brand-gray">Unit {unit.unitNumber}</span>
        ) : null}
      </div>

      <h3 className="mt-2 text-xl font-bold text-brand-charcoal">{unit.name}</h3>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {unit.year ? (
          <div>
            <dt className="text-brand-gray">Year</dt>
            <dd className="font-medium text-brand-charcoal">{unit.year}</dd>
          </div>
        ) : null}
        {unit.manufacturer ? (
          <div>
            <dt className="text-brand-gray">Manufacturer</dt>
            <dd className="font-medium text-brand-charcoal">{unit.manufacturer}</dd>
          </div>
        ) : null}
        {unit.model ? (
          <div>
            <dt className="text-brand-gray">Model</dt>
            <dd className="font-medium text-brand-charcoal">{unit.model}</dd>
          </div>
        ) : null}
        {pumpLabel ? (
          <div>
            <dt className="text-brand-gray">Pump Capacity</dt>
            <dd className="font-medium text-brand-charcoal">{pumpLabel}</dd>
          </div>
        ) : null}
        {waterLabel ? (
          <div>
            <dt className="text-brand-gray">Water Capacity</dt>
            <dd className="font-medium text-brand-charcoal">{waterLabel}</dd>
          </div>
        ) : null}
      </dl>

      {unit.equipmentNotes ? (
        <p className="mt-4 flex-1 border-t border-gray-100 pt-4 text-sm leading-relaxed text-brand-gray">
          {unit.equipmentNotes}
        </p>
      ) : null}
    </Card>
  );
}

export function PublicFleetGrid() {
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
        if (!cancelled) setFleet(items);
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

  if (loading) {
    return <SkeletonGrid count={3} />;
  }

  if (error) {
    return (
      <AlertBanner variant="error" title="Could not load fleet">
        {error}
      </AlertBanner>
    );
  }

  if (fleet.length === 0) {
    return (
      <EmptyState
        title="Fleet information coming soon"
        description="Apparatus details will be published here as they are added by department leadership."
      />
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {fleet.map((unit) => (
        <PublicFleetCard key={unit.id} unit={unit} />
      ))}
    </div>
  );
}

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

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={unit.type} className="bg-gold-100 text-gold-600" />
          {unit.unitNumber ? (
            <span className="text-sm font-semibold text-gray-500">Unit {unit.unitNumber}</span>
          ) : null}
        </div>

        <h3 className="mt-2 text-xl font-bold text-navy-900">{unit.name}</h3>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {unit.year ? (
            <div>
              <dt className="text-gray-500">Year</dt>
              <dd className="font-medium text-text-dark">{unit.year}</dd>
            </div>
          ) : null}
          {unit.manufacturer ? (
            <div>
              <dt className="text-gray-500">Manufacturer</dt>
              <dd className="font-medium text-text-dark">{unit.manufacturer}</dd>
            </div>
          ) : null}
          {unit.model ? (
            <div>
              <dt className="text-gray-500">Model</dt>
              <dd className="font-medium text-text-dark">{unit.model}</dd>
            </div>
          ) : null}
          {pumpLabel ? (
            <div>
              <dt className="text-gray-500">Pump Capacity</dt>
              <dd className="font-medium text-text-dark">{pumpLabel}</dd>
            </div>
          ) : null}
          {waterLabel ? (
            <div>
              <dt className="text-gray-500">Water Capacity</dt>
              <dd className="font-medium text-text-dark">{waterLabel}</dd>
            </div>
          ) : null}
        </dl>

        {unit.equipmentNotes ? (
          <p className="mt-4 flex-1 border-t border-gray-200 pt-4 text-sm leading-relaxed text-gray-500">
            {unit.equipmentNotes}
          </p>
        ) : null}
      </div>
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

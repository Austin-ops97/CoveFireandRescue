"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import type { FleetUnitRecord } from "@/lib/fleet/types";

type FleetUnitReferenceProps = {
  fleetUnitId?: string | null;
  fleetUnitName?: string | null;
  fleetUnitsById?: Map<string, FleetUnitRecord>;
  isAdmin?: boolean;
  className?: string;
};

export function FleetUnitReference({
  fleetUnitId,
  fleetUnitName,
  fleetUnitsById,
  isAdmin = false,
  className = "",
}: FleetUnitReferenceProps) {
  if (!fleetUnitId && !fleetUnitName) {
    return null;
  }

  const fleetUnit = fleetUnitId ? fleetUnitsById?.get(fleetUnitId) : undefined;
  const isMissingFromCatalog =
    Boolean(fleetUnitId) && Boolean(fleetUnitsById?.size) && !fleetUnit;
  const isArchived =
    fleetUnit?.status === "archived" ||
    fleetUnit?.status === "inactive" ||
    fleetUnit?.active === false ||
    isMissingFromCatalog;
  const displayName = fleetUnitName ?? fleetUnit?.name ?? "Fleet unit";
  const typeLabel = fleetUnit?.type;
  const unitNumber = fleetUnit?.unitNumber;

  const labelParts = [displayName];
  if (unitNumber) labelParts.push(`#${unitNumber}`);
  if (typeLabel) labelParts.push(typeLabel);

  const content = (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-brand-gray">{labelParts.join(" · ")}</span>
      {isArchived ? (
        <StatusBadge label="Archived unit" variant="neutral" />
      ) : null}
    </span>
  );

  if (isAdmin && fleetUnitId) {
    return (
      <Link
        href={`/dashboard/fleet?unit=${encodeURIComponent(fleetUnitId)}`}
        className="inline-flex flex-wrap items-center gap-2 rounded-md text-sm font-medium text-brand-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40"
      >
        {labelParts.join(" · ")}
        {isArchived ? <StatusBadge label="Archived unit" variant="neutral" /> : null}
      </Link>
    );
  }

  return content;
}

import { Card } from "@/components/site/Card";
import type { FleetUnit } from "@/lib/types";

interface FleetCardProps {
  unit: FleetUnit;
}

export function FleetCard({ unit }: FleetCardProps) {
  return (
    <Card hover className="flex flex-col">
      <div
        className="mb-4 flex aspect-video w-full items-center justify-center rounded-md bg-brand-charcoal/5 text-brand-gray"
        aria-label={`Image placeholder for ${unit.unitName}`}
      >
        <span className="text-sm font-medium">Apparatus Photo</span>
      </div>
      <h3 className="text-xl font-bold text-brand-charcoal">{unit.unitName}</h3>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-brand-gray">Year</dt>
          <dd className="font-medium">{unit.year ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-brand-gray">Manufacturer</dt>
          <dd className="font-medium">{unit.manufacturer ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-brand-gray">Pump Capacity</dt>
          <dd className="font-medium">{unit.pumpCapacity ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-brand-gray">Water Capacity</dt>
          <dd className="font-medium">{unit.waterCapacity ?? "—"}</dd>
        </div>
      </dl>
      {unit.equipmentNotes && (
        <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-brand-gray">
          {unit.equipmentNotes}
        </p>
      )}
    </Card>
  );
}

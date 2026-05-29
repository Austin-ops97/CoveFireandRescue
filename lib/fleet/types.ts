export type FleetUnitStatus = "active" | "inactive" | "archived";

export type FleetUnitRecord = {
  id: string;
  name: string;
  unitNumber: string;
  type: string;
  year: string;
  manufacturer: string;
  model?: string | null;
  pumpCapacityGpm?: number | null;
  waterCapacityGallons?: number | null;
  equipmentNotes: string;
  imageFileIds: string[];
  primaryImageUrl?: string | null;
  status: FleetUnitStatus;
  active: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FleetUnitFormState = {
  id?: string;
  name: string;
  unitNumber: string;
  type: string;
  year: string;
  manufacturer: string;
  model: string;
  pumpCapacityGpm: string;
  waterCapacityGallons: string;
  equipmentNotes: string;
  imageFileIds: string[];
  status: FleetUnitStatus;
  active: boolean;
  sortOrder: string;
};

export const FLEET_STATUSES: Array<{
  value: FleetUnitStatus;
  label: string;
}> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export const FLEET_TYPES = [
  "Engine",
  "Tanker",
  "Brush Truck",
  "Rescue",
  "Command",
  "Utility",
  "Trailer",
  "Other",
] as const;

export function getFleetStatusLabel(status: FleetUnitStatus): string {
  return FLEET_STATUSES.find((item) => item.value === status)?.label ?? status;
}

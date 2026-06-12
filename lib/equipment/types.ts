export type EquipmentStatus = "active" | "maintenance" | "retired";

export type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  serialNumber?: string;
  status: EquipmentStatus;
  lastMaintenanceAt?: string | null;
  nextMaintenanceDue?: string | null;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type EquipmentFormState = {
  id?: string;
  name: string;
  category: string;
  location: string;
  serialNumber: string;
  status: EquipmentStatus;
  lastMaintenanceAt: string;
  nextMaintenanceDue: string;
  notes: string;
};

export const EQUIPMENT_STATUSES: { value: EquipmentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "In maintenance" },
  { value: "retired", label: "Retired" },
];

export const EQUIPMENT_CATEGORIES = [
  "PPE",
  "Tools",
  "Medical",
  "Communications",
  "Station",
  "Other",
] as const;

export function getEquipmentStatusLabel(status: EquipmentStatus): string {
  return EQUIPMENT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

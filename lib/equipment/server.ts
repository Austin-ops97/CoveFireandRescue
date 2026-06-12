import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { EquipmentFormState, EquipmentItem, EquipmentStatus } from "@/lib/equipment/types";

const VALID_STATUSES: EquipmentStatus[] = ["active", "maintenance", "retired"];

export class EquipmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EquipmentValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readStatus(value: unknown): EquipmentStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as EquipmentStatus)) {
    return value as EquipmentStatus;
  }
  return "active";
}

function readOptionalDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new EquipmentValidationError("Date must be a valid ISO date string.");
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new EquipmentValidationError("Date must be a valid ISO date string.");
  }
  return new Date(ms).toISOString();
}

export function serializeEquipmentDoc(doc: DocumentSnapshot): EquipmentItem {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "",
    category: typeof data.category === "string" ? data.category : "",
    location: typeof data.location === "string" ? data.location : "",
    serialNumber: typeof data.serialNumber === "string" ? data.serialNumber : "",
    status: readStatus(data.status),
    lastMaintenanceAt:
      typeof data.lastMaintenanceAt === "string"
        ? data.lastMaintenanceAt
        : data.lastMaintenanceAt === null
          ? null
          : undefined,
    nextMaintenanceDue:
      typeof data.nextMaintenanceDue === "string"
        ? data.nextMaintenanceDue
        : data.nextMaintenanceDue === null
          ? null
          : undefined,
    notes: typeof data.notes === "string" ? data.notes : "",
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function equipmentSortKey(record: EquipmentItem): string {
  return `${record.status === "retired" ? "1" : "0"}-${record.name.toLowerCase()}`;
}

export function validateEquipmentPayload(input: EquipmentFormState): {
  name: string;
  category: string;
  location: string;
  serialNumber: string;
  status: EquipmentStatus;
  lastMaintenanceAt: string | null;
  nextMaintenanceDue: string | null;
  notes: string;
} {
  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new EquipmentValidationError("Item name is required (120 characters max).");
  }

  const category = input.category.trim();
  if (!category || category.length > 80) {
    throw new EquipmentValidationError("Category is required (80 characters max).");
  }

  const location = input.location.trim();
  if (!location || location.length > 120) {
    throw new EquipmentValidationError("Location is required (120 characters max).");
  }

  const serialNumber = input.serialNumber.trim();
  if (serialNumber.length > 80) {
    throw new EquipmentValidationError("Serial number must be 80 characters or fewer.");
  }

  const status = readStatus(input.status);
  const lastMaintenanceAt = readOptionalDate(input.lastMaintenanceAt || null);
  const nextMaintenanceDue = readOptionalDate(input.nextMaintenanceDue || null);

  const notes = input.notes.trim();
  if (notes.length > 2000) {
    throw new EquipmentValidationError("Notes must be 2000 characters or fewer.");
  }

  return {
    name,
    category,
    location,
    serialNumber,
    status,
    lastMaintenanceAt,
    nextMaintenanceDue,
    notes,
  };
}

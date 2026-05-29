import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { FleetUnitRecord, FleetUnitStatus } from "@/lib/fleet/types";

const VALID_STATUSES: FleetUnitStatus[] = ["active", "inactive", "archived"];

export class FleetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FleetValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readStatus(value: unknown): FleetUnitStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as FleetUnitStatus)) {
    return value as FleetUnitStatus;
  }
  return "active";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function parseOptionalNumericString(value: unknown, fieldLabel: string): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    throw new FleetValidationError(`${fieldLabel} must be a number.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new FleetValidationError(`${fieldLabel} must be a valid number.`);
  }
  return parsed;
}

function parseSortOrder(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 999;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 999;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      throw new FleetValidationError("Sort order must be a valid number.");
    }
    return parsed;
  }
  throw new FleetValidationError("Sort order must be a valid number.");
}

export function serializeFleetDoc(doc: DocumentSnapshot): FleetUnitRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "",
    unitNumber: typeof data.unitNumber === "string" ? data.unitNumber : "",
    type: typeof data.type === "string" && data.type.trim() ? data.type : "Other",
    year: typeof data.year === "string" ? data.year : "",
    manufacturer: typeof data.manufacturer === "string" ? data.manufacturer : "",
    model:
      typeof data.model === "string"
        ? data.model
        : data.model === null
          ? null
          : null,
    pumpCapacityGpm: readOptionalNumber(data.pumpCapacityGpm),
    waterCapacityGallons: readOptionalNumber(data.waterCapacityGallons),
    equipmentNotes: typeof data.equipmentNotes === "string" ? data.equipmentNotes : "",
    imageFileIds: readStringArray(data.imageFileIds),
    status: readStatus(data.status),
    active: data.active !== false,
    sortOrder: typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 999,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function validateFleetPayload(input: unknown): {
  name: string;
  unitNumber: string;
  type: string;
  year: string;
  manufacturer: string;
  model: string | null;
  pumpCapacityGpm: number | null;
  waterCapacityGallons: number | null;
  equipmentNotes: string;
  imageFileIds?: string[];
  status: FleetUnitStatus;
  active: boolean;
  sortOrder: number;
} {
  if (!input || typeof input !== "object") {
    throw new FleetValidationError("Invalid fleet unit payload.");
  }

  const payload = input as Record<string, unknown>;

  if (typeof payload.name !== "string" || !payload.name.trim()) {
    throw new FleetValidationError("Unit name is required.");
  }

  const name = payload.name.trim();
  if (name.length > 100) {
    throw new FleetValidationError("Unit name must be 100 characters or fewer.");
  }

  let unitNumber = "";
  if (payload.unitNumber !== undefined && payload.unitNumber !== null) {
    if (typeof payload.unitNumber !== "string") {
      throw new FleetValidationError("Unit number must be a string.");
    }
    unitNumber = payload.unitNumber.trim();
    if (unitNumber.length > 50) {
      throw new FleetValidationError("Unit number must be 50 characters or fewer.");
    }
  }

  if (typeof payload.type !== "string" || !payload.type.trim()) {
    throw new FleetValidationError("Type is required.");
  }

  const type = payload.type.trim();
  if (type.length > 80) {
    throw new FleetValidationError("Type must be 80 characters or fewer.");
  }

  let year = "";
  if (payload.year !== undefined && payload.year !== null) {
    if (typeof payload.year !== "string") {
      throw new FleetValidationError("Year must be a string.");
    }
    year = payload.year.trim();
    if (year.length > 20) {
      throw new FleetValidationError("Year must be 20 characters or fewer.");
    }
  }

  let manufacturer = "";
  if (payload.manufacturer !== undefined && payload.manufacturer !== null) {
    if (typeof payload.manufacturer !== "string") {
      throw new FleetValidationError("Manufacturer must be a string.");
    }
    manufacturer = payload.manufacturer.trim();
    if (manufacturer.length > 100) {
      throw new FleetValidationError("Manufacturer must be 100 characters or fewer.");
    }
  }

  let model: string | null = null;
  if (payload.model !== undefined && payload.model !== null) {
    if (typeof payload.model !== "string") {
      throw new FleetValidationError("Model must be a string.");
    }
    const trimmedModel = payload.model.trim();
    if (trimmedModel.length > 100) {
      throw new FleetValidationError("Model must be 100 characters or fewer.");
    }
    model = trimmedModel || null;
  }

  const pumpCapacityGpm = parseOptionalNumericString(
    payload.pumpCapacityGpm,
    "Pump capacity (GPM)"
  );
  const waterCapacityGallons = parseOptionalNumericString(
    payload.waterCapacityGallons,
    "Water capacity (gallons)"
  );

  let equipmentNotes = "";
  if (payload.equipmentNotes !== undefined && payload.equipmentNotes !== null) {
    if (typeof payload.equipmentNotes !== "string") {
      throw new FleetValidationError("Equipment notes must be a string.");
    }
    equipmentNotes = payload.equipmentNotes;
    if (equipmentNotes.length > 5000) {
      throw new FleetValidationError("Equipment notes must be 5000 characters or fewer.");
    }
  }

  if (
    typeof payload.status !== "string" ||
    !VALID_STATUSES.includes(payload.status as FleetUnitStatus)
  ) {
    throw new FleetValidationError("Status must be active, inactive, or archived.");
  }

  if (typeof payload.active !== "boolean") {
    throw new FleetValidationError("Active must be a boolean.");
  }

  const sortOrder = parseSortOrder(payload.sortOrder);

  let imageFileIds: string[] | undefined;
  if (payload.imageFileIds !== undefined) {
    if (!Array.isArray(payload.imageFileIds)) {
      throw new FleetValidationError("Image file ids must be an array.");
    }
    const ids = payload.imageFileIds
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    if (ids.length > 20) {
      throw new FleetValidationError("At most 20 images are allowed per fleet unit.");
    }
    imageFileIds = ids;
  }

  return {
    name,
    unitNumber,
    type,
    year,
    manufacturer,
    model,
    pumpCapacityGpm,
    waterCapacityGallons,
    equipmentNotes,
    imageFileIds,
    status: payload.status as FleetUnitStatus,
    active: payload.active,
    sortOrder,
  };
}

export async function attachFleetPrimaryImageUrls(
  fleet: FleetUnitRecord[]
): Promise<FleetUnitRecord[]> {
  const { getStoredFilesByIds } = await import("@/lib/storage/server");
  const fileIds = fleet.flatMap((unit) => unit.imageFileIds).filter(Boolean);
  const files = await getStoredFilesByIds(fileIds);

  return fleet.map((unit) => {
    const primaryId = unit.imageFileIds[0];
    const primaryImageUrl =
      primaryId && files[primaryId]?.publicUrl ? files[primaryId].publicUrl : null;

    return {
      ...unit,
      primaryImageUrl,
    };
  });
}

export function sortFleetForPublic(fleet: FleetUnitRecord[]): FleetUnitRecord[] {
  return [...fleet].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function sortFleetForAdmin(fleet: FleetUnitRecord[]): FleetUnitRecord[] {
  return [...fleet].sort((a, b) => {
    const aArchived = a.status === "archived" ? 1 : 0;
    const bArchived = b.status === "archived" ? 1 : 0;
    if (aArchived !== bArchived) {
      return aArchived - bArchived;
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

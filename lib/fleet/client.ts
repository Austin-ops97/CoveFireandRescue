"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { FleetUnitFormState, FleetUnitRecord } from "@/lib/fleet/types";

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // ignore JSON parse errors
  }

  return `Request failed (${response.status})`;
}

export async function fetchPublicFleet(): Promise<FleetUnitRecord[]> {
  const response = await fetch("/api/fleet", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { fleet?: FleetUnitRecord[] };
  return Array.isArray(data.fleet) ? data.fleet : [];
}

export async function fetchAdminFleet(): Promise<FleetUnitRecord[]> {
  const response = await authenticatedFetch("/api/admin/fleet");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { fleet?: FleetUnitRecord[] };
  return Array.isArray(data.fleet) ? data.fleet : [];
}

export async function saveFleetUnit(payload: FleetUnitFormState): Promise<FleetUnitRecord> {
  const response = await authenticatedFetch("/api/admin/fleet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { fleetUnit?: FleetUnitRecord };
  if (!data.fleetUnit) {
    throw new Error("Server did not return the saved fleet unit.");
  }

  return data.fleetUnit;
}

function fleetRecordToArchivePayload(record: FleetUnitRecord): FleetUnitFormState {
  return {
    id: record.id,
    name: record.name,
    unitNumber: record.unitNumber,
    type: record.type,
    year: record.year,
    manufacturer: record.manufacturer,
    model: record.model ?? "",
    pumpCapacityGpm:
      record.pumpCapacityGpm !== null && record.pumpCapacityGpm !== undefined
        ? String(record.pumpCapacityGpm)
        : "",
    waterCapacityGallons:
      record.waterCapacityGallons !== null && record.waterCapacityGallons !== undefined
        ? String(record.waterCapacityGallons)
        : "",
    equipmentNotes: record.equipmentNotes,
    imageFileIds: record.imageFileIds,
    status: "archived",
    active: false,
    sortOrder: String(record.sortOrder),
  };
}

export async function archiveFleetUnit(record: FleetUnitRecord): Promise<FleetUnitRecord> {
  return saveFleetUnit(fleetRecordToArchivePayload(record));
}

export async function deleteFleetUnit(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/fleet/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

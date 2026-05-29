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

export async function archiveFleetUnit(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/fleet/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

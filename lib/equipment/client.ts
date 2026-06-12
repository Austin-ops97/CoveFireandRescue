"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { EquipmentFormState, EquipmentItem } from "@/lib/equipment/types";

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

export async function fetchEquipmentItems(): Promise<EquipmentItem[]> {
  const response = await authenticatedFetch("/api/admin/equipment");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { items?: EquipmentItem[] };
  return Array.isArray(data.items) ? data.items : [];
}

export async function saveEquipmentItem(payload: EquipmentFormState): Promise<EquipmentItem> {
  const response = await authenticatedFetch("/api/admin/equipment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { item?: EquipmentItem };
  if (!data.item) {
    throw new Error("Server did not return the saved item.");
  }

  return data.item;
}

export async function deleteEquipmentItem(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/equipment/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

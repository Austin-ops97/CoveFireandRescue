"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type {
  NationalNightOutRequestRecord,
  NationalNightOutSettings,
  NationalNightOutStatus,
} from "./types";

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export async function fetchAdminNationalNightOutSettings(): Promise<NationalNightOutSettings> {
  const response = await authenticatedFetch("/api/admin/national-night-out/settings");
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { settings?: NationalNightOutSettings };
  return {
    enabled: data.settings?.enabled === true,
    updatedAt: data.settings?.updatedAt ?? null,
    updatedBy: data.settings?.updatedBy ?? null,
  };
}

export async function updateNationalNightOutSettings(enabled: boolean): Promise<NationalNightOutSettings> {
  const response = await authenticatedFetch("/api/admin/national-night-out/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { settings?: NationalNightOutSettings };
  return {
    enabled: data.settings?.enabled === true,
    updatedAt: data.settings?.updatedAt ?? null,
    updatedBy: data.settings?.updatedBy ?? null,
  };
}

export async function fetchAdminNationalNightOutRequests(): Promise<NationalNightOutRequestRecord[]> {
  const response = await authenticatedFetch("/api/admin/national-night-out/requests");
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { requests?: NationalNightOutRequestRecord[] };
  return Array.isArray(data.requests) ? data.requests : [];
}

export async function updateNationalNightOutRequestStatus(
  id: string,
  status: NationalNightOutStatus
): Promise<NationalNightOutRequestRecord> {
  const response = await authenticatedFetch(
    `/api/admin/national-night-out/requests/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { request?: NationalNightOutRequestRecord };
  if (!data.request) {
    throw new Error("Status was updated but no request was returned.");
  }
  return data.request;
}

export async function deleteNationalNightOutRequest(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/admin/national-night-out/requests/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

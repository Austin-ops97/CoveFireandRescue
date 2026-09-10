"use client";

import type { NationalNightOutFormPayload, NationalNightOutSettings } from "./types";

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

export async function fetchNationalNightOutSettings(): Promise<NationalNightOutSettings> {
  const response = await fetch("/api/national-night-out/settings", {
    method: "GET",
    cache: "no-store",
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

export async function submitNationalNightOutRequest(
  payload: NationalNightOutFormPayload
): Promise<{ id: string; requestId: string }> {
  const response = await fetch("/api/national-night-out/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { id?: string; requestId?: string };
  if (!data.id || !data.requestId) {
    throw new Error("Request was submitted but no confirmation id was returned.");
  }

  return { id: data.id, requestId: data.requestId };
}

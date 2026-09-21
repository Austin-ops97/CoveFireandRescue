"use client";

import type {
  NationalNightOutFormPayload,
  NationalNightOutPublicStatus,
  NationalNightOutSettings,
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
): Promise<{ id: string; requestId: string; emailNotification: "sent" | "not_sent" }> {
  const response = await fetch("/api/national-night-out/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as {
    id?: string;
    requestId?: string;
    emailNotification?: string;
  };
  if (!data.id || !data.requestId) {
    throw new Error("Request was submitted but no confirmation id was returned.");
  }

  return {
    id: data.id,
    requestId: data.requestId,
    emailNotification: data.emailNotification === "sent" ? "sent" : "not_sent",
  };
}

export async function lookupNationalNightOutStatus(
  requestId: string,
  email: string
): Promise<NationalNightOutPublicStatus> {
  const response = await fetch("/api/national-night-out/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, email }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { status?: NationalNightOutPublicStatus };
  if (!data.status?.requestId || !data.status.status) {
    throw new Error("Status could not be read from the response.");
  }
  return data.status;
}

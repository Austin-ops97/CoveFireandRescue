"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { ApplicationRecord } from "./types";

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

export async function fetchAdminApplications(): Promise<ApplicationRecord[]> {
  const response = await authenticatedFetch("/api/admin/applications");
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { applications?: ApplicationRecord[] };
  return Array.isArray(data.applications) ? data.applications : [];
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/admin/applications/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { DashboardSummary } from "@/lib/dashboard/types";

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

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await authenticatedFetch("/api/dashboard/summary", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as DashboardSummary;
}

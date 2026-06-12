"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { TrainingRecord, TrainingRecordFormState } from "@/lib/training/types";

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

export async function fetchTrainingRecords(): Promise<TrainingRecord[]> {
  const response = await authenticatedFetch("/api/admin/training-records");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { records?: TrainingRecord[] };
  return Array.isArray(data.records) ? data.records : [];
}

export async function saveTrainingRecord(
  payload: TrainingRecordFormState
): Promise<TrainingRecord> {
  const response = await authenticatedFetch("/api/admin/training-records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { record?: TrainingRecord };
  if (!data.record) {
    throw new Error("Server did not return the saved record.");
  }

  return data.record;
}

export async function deleteTrainingRecord(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/training-records/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

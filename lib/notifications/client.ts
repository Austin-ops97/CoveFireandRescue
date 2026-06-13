"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { ChecklistNotificationRecord } from "@/lib/checklist/types";

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

export async function fetchChecklistNotifications(): Promise<ChecklistNotificationRecord[]> {
  const response = await authenticatedFetch("/api/checklist-notifications");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { notifications?: ChecklistNotificationRecord[] };
  return Array.isArray(data.notifications) ? data.notifications : [];
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const response = await authenticatedFetch("/api/checklist-notifications/unread-count");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { count?: number };
  return typeof data.count === "number" ? data.count : 0;
}

export async function acknowledgeChecklistNotification(
  id: string
): Promise<ChecklistNotificationRecord> {
  const response = await authenticatedFetch(
    `/api/checklist-notifications/${encodeURIComponent(id)}/acknowledge`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { notification?: ChecklistNotificationRecord };
  if (!data.notification) {
    throw new Error("Server did not return the updated notification.");
  }

  return data.notification;
}

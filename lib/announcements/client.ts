"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { AnnouncementFormState, AnnouncementRecord } from "@/lib/announcements/types";

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

export async function fetchPublicAnnouncements(): Promise<AnnouncementRecord[]> {
  const response = await fetch("/api/announcements", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { announcements?: AnnouncementRecord[] };
  return Array.isArray(data.announcements) ? data.announcements : [];
}

export async function fetchAdminAnnouncements(): Promise<AnnouncementRecord[]> {
  const response = await authenticatedFetch("/api/admin/announcements");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { announcements?: AnnouncementRecord[] };
  return Array.isArray(data.announcements) ? data.announcements : [];
}

export async function saveAnnouncement(
  payload: AnnouncementFormState
): Promise<AnnouncementRecord> {
  const response = await authenticatedFetch("/api/admin/announcements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { announcement?: AnnouncementRecord };
  if (!data.announcement) {
    throw new Error("Server did not return the saved announcement.");
  }

  return data.announcement;
}

export async function archiveAnnouncement(record: AnnouncementRecord): Promise<AnnouncementRecord> {
  return saveAnnouncement({
    id: record.id,
    title: record.title,
    body: record.body,
    category: record.category,
    status: "archived",
    pinned: record.pinned,
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/announcements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

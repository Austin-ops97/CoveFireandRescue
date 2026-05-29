"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { LeadershipMemberFormState, LeadershipMemberRecord } from "@/lib/leadership/types";

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

export async function fetchPublicLeadership(): Promise<LeadershipMemberRecord[]> {
  const response = await fetch("/api/leadership", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { leadership?: LeadershipMemberRecord[] };
  return Array.isArray(data.leadership) ? data.leadership : [];
}

export async function fetchAdminLeadership(): Promise<LeadershipMemberRecord[]> {
  const response = await authenticatedFetch("/api/admin/leadership");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { leadership?: LeadershipMemberRecord[] };
  return Array.isArray(data.leadership) ? data.leadership : [];
}

export async function saveLeadershipMember(
  payload: LeadershipMemberFormState
): Promise<LeadershipMemberRecord> {
  const response = await authenticatedFetch("/api/admin/leadership", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { leadershipMember?: LeadershipMemberRecord };
  if (!data.leadershipMember) {
    throw new Error("Server did not return the saved leadership member.");
  }

  return data.leadershipMember;
}

export async function archiveLeadershipMember(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/admin/leadership/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

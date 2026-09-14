"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { RosterMemberFormState, RosterMemberRecord } from "./types";

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

export async function fetchRosterMembers(): Promise<RosterMemberRecord[]> {
  const response = await authenticatedFetch("/api/roster");
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { members?: RosterMemberRecord[] };
  return Array.isArray(data.members) ? data.members : [];
}

export async function saveRosterMember(
  payload: RosterMemberFormState
): Promise<RosterMemberRecord> {
  const response = await authenticatedFetch("/api/roster", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { member?: RosterMemberRecord };
  if (!data.member) {
    throw new Error("Server did not return the saved roster member.");
  }
  return data.member;
}

export async function deleteRosterMember(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/roster/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

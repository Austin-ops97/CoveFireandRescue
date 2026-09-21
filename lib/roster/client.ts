"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { RosterMemberInput, RosterMemberRecord } from "./types";

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

export async function createRosterMember(
  input: RosterMemberInput
): Promise<RosterMemberRecord> {
  const response = await authenticatedFetch("/api/roster", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { member?: RosterMemberRecord };
  if (!data.member) {
    throw new Error("The member was saved but no record was returned.");
  }
  return data.member;
}

export async function updateRosterMember(
  id: string,
  input: RosterMemberInput
): Promise<RosterMemberRecord> {
  const response = await authenticatedFetch(`/api/roster/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { member?: RosterMemberRecord };
  if (!data.member) {
    throw new Error("The member was updated but no record was returned.");
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

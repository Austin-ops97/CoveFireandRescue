"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { ManagedUserFormState, ManagedUserProfile } from "@/lib/users/types";

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

export async function fetchManagedUsers(): Promise<ManagedUserProfile[]> {
  const response = await authenticatedFetch("/api/admin/users");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { users?: ManagedUserProfile[] };
  return Array.isArray(data.users) ? data.users : [];
}

export async function saveManagedUser(
  payload: ManagedUserFormState
): Promise<ManagedUserProfile> {
  const response = await authenticatedFetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid: payload.uid.trim(),
      email: payload.email.trim() || null,
      displayName: payload.displayName.trim() || null,
      role: payload.role,
      active: payload.active,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { user?: ManagedUserProfile };
  if (!data.user) {
    throw new Error("Server did not return the saved user profile.");
  }

  return data.user;
}

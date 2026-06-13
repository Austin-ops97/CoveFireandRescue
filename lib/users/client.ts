"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type {
  CreateUserFormState,
  EditUserFormState,
  ManagedUserProfile,
  ResetPasswordFormState,
} from "@/lib/users/types";

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

export type CreateUserResult = {
  user: ManagedUserProfile;
  message: string;
  passwordSetupLink: string | null;
  emailWarning?: string | null;
  departmentEmail?: string | null;
};

export async function createManagedUser(
  payload: CreateUserFormState
): Promise<CreateUserResult> {
  const response = await authenticatedFetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim(),
      role: payload.role,
      active: payload.active,
      phone: payload.phone.trim() || null,
      title: payload.title.trim() || null,
      passwordMode: payload.passwordMode,
      temporaryPassword:
        payload.passwordMode === "temporary" ? payload.temporaryPassword : null,
      createDepartmentEmail: payload.createDepartmentEmail,
      departmentEmailUsername: payload.createDepartmentEmail
        ? payload.departmentEmailUsername.trim()
        : null,
      departmentEmailPassword: payload.createDepartmentEmail
        ? payload.departmentEmailPassword
        : null,
      departmentEmailPasswordConfirm: payload.createDepartmentEmail
        ? payload.departmentEmailPasswordConfirm
        : null,
      departmentEmailQuota: payload.createDepartmentEmail
        ? payload.departmentEmailQuota
        : null,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as CreateUserResult;
  if (!data.user) {
    throw new Error("Server did not return the created user profile.");
  }

  return data;
}

export async function updateManagedUser(
  uid: string,
  payload: EditUserFormState
): Promise<ManagedUserProfile> {
  const response = await authenticatedFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      role: payload.role,
      active: payload.active,
      phone: payload.phone.trim() || null,
      title: payload.title.trim() || null,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { user?: ManagedUserProfile };
  if (!data.user) {
    throw new Error("Server did not return the updated user profile.");
  }

  return data.user;
}

export async function disableManagedUser(uid: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function deleteManagedUserPermanently(uid: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/admin/users/${encodeURIComponent(uid)}?permanent=true`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export type ResetPasswordResult = {
  message: string;
  passwordSetupLink: string | null;
};

export async function resetManagedUserPassword(
  uid: string,
  payload: ResetPasswordFormState
): Promise<ResetPasswordResult> {
  const response = await authenticatedFetch(
    `/api/admin/users/${encodeURIComponent(uid)}/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: payload.mode,
        temporaryPassword:
          payload.mode === "temporary" ? payload.temporaryPassword : null,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as ResetPasswordResult;
}

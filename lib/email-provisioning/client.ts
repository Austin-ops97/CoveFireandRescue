"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { DepartmentEmailQuotaMb } from "@/lib/email-provisioning/validation";
import type { ManagedUserProfile } from "@/lib/users/types";

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

export type EmailProvisioningConfig = {
  configured: boolean;
  domain: string | null;
  quotaOptions: Array<{ value: number; label: string }>;
  supportsUnlimited: boolean;
};

export async function fetchEmailProvisioningConfig(): Promise<EmailProvisioningConfig> {
  const response = await authenticatedFetch("/api/admin/email-provisioning/config");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as EmailProvisioningConfig;
}

export type DepartmentEmailFormPayload = {
  emailUsername: string;
  password: string;
  confirmPassword: string;
  quotaMb: DepartmentEmailQuotaMb;
};

export type ProvisionDepartmentEmailResult = {
  user: ManagedUserProfile;
  emailAddress: string;
  message: string;
};

export async function provisionDepartmentEmail(
  uid: string,
  payload: DepartmentEmailFormPayload
): Promise<ProvisionDepartmentEmailResult> {
  const response = await authenticatedFetch(
    `/api/admin/users/${encodeURIComponent(uid)}/department-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as ProvisionDepartmentEmailResult;
}

export async function resetDepartmentEmailPassword(
  uid: string,
  payload: { password: string; confirmPassword: string }
): Promise<{ message: string }> {
  const response = await authenticatedFetch(
    `/api/admin/users/${encodeURIComponent(uid)}/department-email/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as { message: string };
}

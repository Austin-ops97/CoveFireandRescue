"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { ContactSubmissionRecord } from "./types";

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

export async function fetchAdminContactSubmissions(): Promise<ContactSubmissionRecord[]> {
  const response = await authenticatedFetch("/api/admin/contact-submissions");
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { submissions?: ContactSubmissionRecord[] };
  return Array.isArray(data.submissions) ? data.submissions : [];
}

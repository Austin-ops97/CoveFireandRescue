"use client";

import type { ApplicationFormPayload } from "./types";

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

export async function submitApplication(payload: ApplicationFormPayload): Promise<{ id: string }> {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Application was submitted but no confirmation id was returned.");
  }

  return { id: data.id };
}

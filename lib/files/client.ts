"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { StoredFileRecord } from "@/lib/storage/types";

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

export async function fetchDocumentLibrary(): Promise<StoredFileRecord[]> {
  const response = await authenticatedFetch("/api/admin/files?module=documents");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { files?: StoredFileRecord[] };
  return Array.isArray(data.files) ? data.files : [];
}

export async function deleteLibraryFile(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/files/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

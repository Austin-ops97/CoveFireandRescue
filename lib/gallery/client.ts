"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { GalleryFormState, GalleryRecord } from "./types";

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

export async function fetchPublicGallery(): Promise<GalleryRecord[]> {
  const response = await fetch("/api/gallery", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { items?: GalleryRecord[] };
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchAdminGallery(): Promise<GalleryRecord[]> {
  const response = await authenticatedFetch("/api/admin/gallery");
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { items?: GalleryRecord[] };
  return Array.isArray(data.items) ? data.items : [];
}

export async function saveGalleryItem(payload: GalleryFormState): Promise<GalleryRecord> {
  const response = await authenticatedFetch("/api/admin/gallery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const data = (await response.json()) as { item?: GalleryRecord };
  if (!data.item) {
    throw new Error("Server did not return the saved gallery item.");
  }
  return data.item;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/admin/gallery/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

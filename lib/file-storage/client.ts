"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type {
  StorageBrowseResult,
  StorageFileRecord,
  StorageFolderRecord,
  StorageFolderTreeNode,
  StorageSearchResult,
  StorageSortDirection,
  StorageSortField,
  StorageVisibility,
} from "@/lib/file-storage/types";

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

export async function fetchStorageTree(): Promise<StorageFolderTreeNode[]> {
  const response = await authenticatedFetch("/api/file-storage/tree", { cache: "no-store" });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = (await response.json()) as { tree?: StorageFolderTreeNode[] };
  return Array.isArray(data.tree) ? data.tree : [];
}

export async function browseStorage(params: {
  folderId?: string | null;
  sortBy?: StorageSortField;
  sortDirection?: StorageSortDirection;
}): Promise<StorageBrowseResult> {
  const searchParams = new URLSearchParams();
  if (params.folderId) searchParams.set("folderId", params.folderId);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  const query = searchParams.toString();
  const response = await authenticatedFetch(
    `/api/file-storage/browse${query ? `?${query}` : ""}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as StorageBrowseResult;
}

export async function createStorageFolder(params: {
  name: string;
  parentId?: string | null;
  visibility?: StorageVisibility;
}): Promise<StorageFolderRecord> {
  const response = await authenticatedFetch("/api/file-storage/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = (await response.json()) as { folder?: StorageFolderRecord };
  if (!data.folder) throw new Error("Server did not return folder metadata.");
  return data.folder;
}

export async function renameStorageFolder(params: {
  id: string;
  name: string;
}): Promise<StorageFolderRecord> {
  const response = await authenticatedFetch(`/api/file-storage/folders/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: params.name }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = (await response.json()) as { folder?: StorageFolderRecord };
  if (!data.folder) throw new Error("Server did not return folder metadata.");
  return data.folder;
}

export async function moveStorageFolder(params: {
  id: string;
  destinationFolderId: string | null;
}): Promise<StorageFolderRecord> {
  const response = await authenticatedFetch(`/api/file-storage/folders/${params.id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destinationFolderId: params.destinationFolderId }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = (await response.json()) as { folder?: StorageFolderRecord };
  if (!data.folder) throw new Error("Server did not return folder metadata.");
  return data.folder;
}

export async function deleteStorageFolder(params: {
  id: string;
  recursive?: boolean;
}): Promise<void> {
  const searchParams = new URLSearchParams();
  if (params.recursive) searchParams.set("recursive", "true");
  const query = searchParams.toString();
  const response = await authenticatedFetch(
    `/api/file-storage/folders/${params.id}${query ? `?${query}` : ""}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(await readApiError(response));
}

export async function uploadStorageFiles(params: {
  files: File[];
  folderId?: string | null;
  visibility?: StorageVisibility;
}): Promise<StorageFileRecord[]> {
  const uploaded: StorageFileRecord[] = [];
  for (const file of params.files) {
    const formData = new FormData();
    formData.append("file", file);
    if (params.folderId) formData.append("folderId", params.folderId);
    if (params.visibility) formData.append("visibility", params.visibility);

    const response = await authenticatedFetch("/api/file-storage/files/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(await readApiError(response));
    const data = (await response.json()) as { file?: StorageFileRecord };
    if (!data.file) throw new Error("Server did not return uploaded file metadata.");
    uploaded.push(data.file);
  }
  return uploaded;
}

export async function renameStorageFile(params: {
  id: string;
  displayName: string;
}): Promise<StorageFileRecord> {
  const response = await authenticatedFetch(`/api/file-storage/files/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: params.displayName }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = (await response.json()) as { file?: StorageFileRecord };
  if (!data.file) throw new Error("Server did not return file metadata.");
  return data.file;
}

export async function moveStorageFile(params: {
  id: string;
  destinationFolderId: string | null;
}): Promise<StorageFileRecord> {
  const response = await authenticatedFetch(`/api/file-storage/files/${params.id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destinationFolderId: params.destinationFolderId }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = (await response.json()) as { file?: StorageFileRecord };
  if (!data.file) throw new Error("Server did not return file metadata.");
  return data.file;
}

export async function deleteStorageFile(
  id: string,
  options?: { metadataOnly?: boolean }
): Promise<void> {
  const searchParams = new URLSearchParams();
  if (options?.metadataOnly) searchParams.set("metadataOnly", "true");
  const query = searchParams.toString();
  const response = await authenticatedFetch(
    `/api/file-storage/files/${id}${query ? `?${query}` : ""}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(await readApiError(response));
}

export async function searchStorage(query: string): Promise<StorageSearchResult> {
  const params = new URLSearchParams({ q: query });
  const response = await authenticatedFetch(`/api/file-storage/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as StorageSearchResult;
}

export async function migrateLegacyStorageFiles(): Promise<{ imported: number; skipped: number }> {
  const response = await authenticatedFetch("/api/file-storage/migrate", { method: "POST" });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as { imported: number; skipped: number };
}

export function getStorageDownloadUrl(fileId: string): string {
  return `/api/file-storage/files/${fileId}/download`;
}

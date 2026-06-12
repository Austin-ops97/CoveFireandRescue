"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { StoredFileRecord } from "@/lib/storage/types";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

/** Matches Vercel serverless body limit for server-side uploads. */
const MAX_SERVER_UPLOAD_BYTES = 4.5 * 1024 * 1024;

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

function validateImageFile(file: File): void {
  if (!file) {
    throw new Error("Please choose an image file to upload.");
  }

  const contentType = file.type.trim().toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Image must be JPEG, PNG, WebP, HEIC, or HEIF.");
  }

  if (file.size <= 0 || file.size > MAX_SERVER_UPLOAD_BYTES) {
    throw new Error(
      `Image must be ${(MAX_SERVER_UPLOAD_BYTES / (1024 * 1024)).toFixed(1)} MB or smaller.`
    );
  }
}

function validateDocumentFile(file: File): void {
  if (!file) {
    throw new Error("Please choose a file to upload.");
  }

  const contentType = file.type.trim().toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_TYPES)[number]);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(
    contentType as (typeof ALLOWED_DOCUMENT_TYPES)[number]
  );

  if (!isImage && !isDocument) {
    throw new Error("File must be PDF, Word, Excel, plain text, or a supported image format.");
  }

  if (file.size <= 0 || file.size > MAX_SERVER_UPLOAD_BYTES) {
    throw new Error(
      `File must be ${(MAX_SERVER_UPLOAD_BYTES / (1024 * 1024)).toFixed(1)} MB or smaller.`
    );
  }
}

export async function resolveStoredFiles(
  ids: string[]
): Promise<Record<string, StoredFileRecord>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {};
  }

  const params = new URLSearchParams({ ids: uniqueIds.join(",") });
  const response = await authenticatedFetch(`/api/files/resolve?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { files?: Record<string, StoredFileRecord> };
  return data.files ?? {};
}

async function uploadFileToB2(params: {
  file: File;
  module: "fleet" | "leadership" | "gallery" | "rounds" | "documents";
  relatedId?: string | null;
}): Promise<StoredFileRecord> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("module", params.module);
  if (params.relatedId) {
    formData.append("relatedId", params.relatedId);
  }

  const response = await authenticatedFetch("/api/storage/b2/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { file?: StoredFileRecord };
  if (!data.file) {
    throw new Error("Server did not return uploaded file metadata.");
  }

  return data.file;
}

export async function uploadImageToB2(params: {
  file: File;
  module: "fleet" | "leadership" | "gallery" | "rounds";
  relatedId?: string | null;
}): Promise<StoredFileRecord> {
  validateImageFile(params.file);
  return uploadFileToB2(params);
}

export async function uploadDocumentToB2(params: {
  file: File;
  relatedId?: string | null;
}): Promise<StoredFileRecord> {
  validateDocumentFile(params.file);
  return uploadFileToB2({
    file: params.file,
    module: "documents",
    relatedId: params.relatedId ?? null,
  });
}

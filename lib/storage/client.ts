"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type {
  CompleteB2UploadRequest,
  CreateB2UploadResponse,
  StoredFileRecord,
} from "@/lib/storage/types";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

type B2UploadResult = {
  fileId: string;
  fileName: string;
};

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

  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 15 MB or smaller.");
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

export async function uploadImageToB2(params: {
  file: File;
  module: "fleet" | "leadership" | "rounds";
  relatedId?: string | null;
}): Promise<StoredFileRecord> {
  validateImageFile(params.file);

  const uploadUrlResponse = await authenticatedFetch("/api/storage/b2/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      module: params.module,
      relatedId: params.relatedId ?? null,
      fileName: params.file.name,
      contentType: params.file.type,
      sizeBytes: params.file.size,
    }),
  });

  if (!uploadUrlResponse.ok) {
    throw new Error(await readApiError(uploadUrlResponse));
  }

  const uploadTarget = (await uploadUrlResponse.json()) as CreateB2UploadResponse;

  const b2Response = await fetch(uploadTarget.uploadUrl, {
    method: "POST",
    headers: {
      Authorization: uploadTarget.authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(uploadTarget.b2Key),
      "Content-Type": params.file.type,
      "X-Bz-Content-Sha1": "do_not_verify",
    },
    body: params.file,
  });

  if (!b2Response.ok) {
    throw new Error(`Backblaze upload failed (${b2Response.status}).`);
  }

  const b2Result = (await b2Response.json()) as B2UploadResult;

  if (!b2Result.fileId) {
    throw new Error("Backblaze did not return a file id.");
  }

  const completePayload: CompleteB2UploadRequest = {
    module: params.module,
    relatedId: params.relatedId ?? null,
    originalFileName: params.file.name,
    fileName: uploadTarget.fileName,
    contentType: params.file.type,
    sizeBytes: params.file.size,
    b2FileId: b2Result.fileId,
    b2Key: uploadTarget.b2Key,
    publicUrl: uploadTarget.publicUrl,
  };

  const completeResponse = await authenticatedFetch("/api/storage/b2/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(completePayload),
  });

  if (!completeResponse.ok) {
    throw new Error(await readApiError(completeResponse));
  }

  const completeData = (await completeResponse.json()) as { file?: StoredFileRecord };
  if (!completeData.file) {
    throw new Error("Server did not return uploaded file metadata.");
  }

  return completeData.file;
}

import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { buildB2FileKey, getB2UploadUrl, getPublicB2Url, isB2Configured } from "@/lib/storage/b2";
import {
  assertAllowedUploadModule,
  serializeStoredFileDoc,
  StorageValidationError,
  validateCreateUploadRequest,
} from "@/lib/storage/server";
import type { StoredFileModule, StoredFileRecord } from "@/lib/storage/types";

/** Vercel serverless request body limit (Hobby plan). */
export const MAX_SERVER_UPLOAD_BYTES = 4.5 * 1024 * 1024;

type B2NativeUploadResult = {
  fileId: string;
  fileName: string;
};

export async function uploadBytesToB2AndPersist(params: {
  bytes: Uint8Array;
  originalFileName: string;
  contentType: string;
  module: StoredFileModule;
  relatedId?: string | null;
  uploadedBy: string;
  uploadedByName?: string | null;
}): Promise<StoredFileRecord> {
  if (!isB2Configured()) {
    throw new StorageValidationError(
      "Backblaze B2 is not configured. Add B2_* environment variables in Vercel and redeploy."
    );
  }

  if (params.bytes.length > MAX_SERVER_UPLOAD_BYTES) {
    throw new StorageValidationError(
      `File is too large for server upload (${(MAX_SERVER_UPLOAD_BYTES / (1024 * 1024)).toFixed(1)} MB max on current hosting). Use a smaller file.`
    );
  }

  const validated = validateCreateUploadRequest({
    module: params.module,
    relatedId: params.relatedId ?? null,
    fileName: params.originalFileName,
    contentType: params.contentType,
    sizeBytes: params.bytes.length,
  });

  assertAllowedUploadModule(validated.module);

  const b2Key = buildB2FileKey({
    module: validated.module,
    relatedId: validated.relatedId,
    fileName: validated.fileName,
  });
  const publicUrl = getPublicB2Url(b2Key);
  const storedFileName = b2Key.split("/").pop() ?? validated.fileName;

  const { uploadUrl, authorizationToken } = await getB2UploadUrl();

  const b2Response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(b2Key),
      "Content-Type": validated.contentType,
      "X-Bz-Content-Sha1": "do_not_verify",
    },
    body: Buffer.from(params.bytes),
  });

  if (!b2Response.ok) {
    const detail = await b2Response.text().catch(() => "");
    throw new Error(
      `Backblaze upload failed (${b2Response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`
    );
  }

  const b2Result = (await b2Response.json()) as B2NativeUploadResult;

  if (!b2Result.fileId) {
    throw new Error("Backblaze did not return a file id.");
  }

  const docRef = adminDb.collection(COLLECTIONS.files).doc();
  await docRef.set({
    fileName: storedFileName,
    originalFileName: params.originalFileName,
    contentType: validated.contentType,
    sizeBytes: params.bytes.length,
    b2FileId: b2Result.fileId,
    b2Key,
    publicUrl,
    uploadedBy: params.uploadedBy,
    uploadedByName: params.uploadedByName ?? null,
    uploadedAt: FieldValue.serverTimestamp(),
    module: validated.module,
    relatedId: validated.relatedId ?? null,
  });

  return serializeStoredFileDoc(await docRef.get());
}

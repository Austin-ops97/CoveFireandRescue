import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type {
  CompleteB2UploadRequest,
  CreateB2UploadRequest,
  StoredFileModule,
  StoredFileRecord,
} from "@/lib/storage/types";

const ALLOWED_MODULES: StoredFileModule[] = [
  "announcements",
  "fleet",
  "rounds",
  "leadership",
  "gallery",
  "documents",
];

const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

const ALLOWED_DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readModule(value: unknown): StoredFileModule {
  if (typeof value === "string" && ALLOWED_MODULES.includes(value as StoredFileModule)) {
    return value as StoredFileModule;
  }
  throw new StorageValidationError("Module is invalid.");
}

function readOptionalRelatedId(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new StorageValidationError("Related id must be a string or null.");
  }
  const trimmed = value.trim();
  if (trimmed.length > 200) {
    throw new StorageValidationError("Related id must be 200 characters or fewer.");
  }
  return trimmed || null;
}

function readFileName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new StorageValidationError("File name is required.");
  }
  const trimmed = value.trim();
  if (trimmed.length > 255) {
    throw new StorageValidationError("File name must be 255 characters or fewer.");
  }
  return trimmed;
}

function readContentType(value: unknown, fileModule: StoredFileModule): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new StorageValidationError("Content type is required.");
  }
  const contentType = value.trim().toLowerCase();

  if (fileModule === "documents") {
    const isAllowedImage = ALLOWED_IMAGE_CONTENT_TYPES.includes(
      contentType as (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number]
    );
    const isAllowedDocument = ALLOWED_DOCUMENT_CONTENT_TYPES.includes(
      contentType as (typeof ALLOWED_DOCUMENT_CONTENT_TYPES)[number]
    );
    if (!isAllowedImage && !isAllowedDocument) {
      throw new StorageValidationError(
        "File type must be PDF, Word, Excel, plain text, or a supported image format."
      );
    }
    return contentType;
  }

  if (!contentType.startsWith("image/")) {
    throw new StorageValidationError("Only image uploads are supported right now.");
  }
  if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number])) {
    throw new StorageValidationError(
      "Image type must be JPEG, PNG, WebP, HEIC, or HEIF."
    );
  }
  return contentType;
}

function readSizeBytes(value: unknown, fileModule: StoredFileModule): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new StorageValidationError("File size must be a positive number.");
  }
  const maxSize =
    fileModule === "documents" ? MAX_DOCUMENT_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (value > maxSize) {
    throw new StorageValidationError(
      fileModule === "documents"
        ? "File size must be 25 MB or smaller."
        : "Image size must be 15 MB or smaller."
    );
  }
  return value;
}

function readRequiredString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new StorageValidationError(`${label} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new StorageValidationError(`${label} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function readStoredModule(value: unknown): StoredFileModule {
  if (typeof value === "string" && ALLOWED_MODULES.includes(value as StoredFileModule)) {
    return value as StoredFileModule;
  }
  return "documents";
}

export function serializeStoredFileDoc(doc: DocumentSnapshot): StoredFileRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    fileName: typeof data.fileName === "string" ? data.fileName : "",
    originalFileName: typeof data.originalFileName === "string" ? data.originalFileName : "",
    contentType: typeof data.contentType === "string" ? data.contentType : "",
    sizeBytes: typeof data.sizeBytes === "number" ? data.sizeBytes : 0,
    b2FileId: typeof data.b2FileId === "string" ? data.b2FileId : "",
    b2Key: typeof data.b2Key === "string" ? data.b2Key : "",
    publicUrl: typeof data.publicUrl === "string" ? data.publicUrl : "",
    uploadedBy: typeof data.uploadedBy === "string" ? data.uploadedBy : "",
    uploadedByName:
      typeof data.uploadedByName === "string"
        ? data.uploadedByName
        : data.uploadedByName === null
          ? null
          : undefined,
    uploadedAt: serializeTimestamp(data.uploadedAt),
    module: readStoredModule(data.module),
    relatedId:
      typeof data.relatedId === "string"
        ? data.relatedId
        : data.relatedId === null
          ? null
          : undefined,
  };
}

export async function getStoredFilesByIds(
  ids: string[]
): Promise<Record<string, StoredFileRecord>> {
  const uniqueIds = [...new Set(ids.filter((id) => typeof id === "string" && id.trim()))].slice(
    0,
    50
  );

  if (uniqueIds.length === 0) {
    return {};
  }

  const refs = uniqueIds.map((id) => adminDb.collection(COLLECTIONS.files).doc(id));
  const snapshots = await adminDb.getAll(...refs);

  const files: Record<string, StoredFileRecord> = {};
  for (const snapshot of snapshots) {
    if (!snapshot.exists) continue;
    files[snapshot.id] = serializeStoredFileDoc(snapshot);
  }

  return files;
}

export function validateCreateUploadRequest(input: unknown): CreateB2UploadRequest {
  if (!input || typeof input !== "object") {
    throw new StorageValidationError("Invalid upload request.");
  }

  const payload = input as Record<string, unknown>;
  const fileModule = readModule(payload.module);
  const relatedId = readOptionalRelatedId(payload.relatedId);
  const fileName = readFileName(payload.fileName);
  const contentType = readContentType(payload.contentType, fileModule);
  const sizeBytes = readSizeBytes(payload.sizeBytes, fileModule);

  return {
    module: fileModule,
    relatedId,
    fileName,
    contentType,
    sizeBytes,
  };
}

export function validateCompleteUploadRequest(input: unknown): CompleteB2UploadRequest {
  if (!input || typeof input !== "object") {
    throw new StorageValidationError("Invalid upload completion request.");
  }

  const payload = input as Record<string, unknown>;
  const fileModule = readModule(payload.module);
  const relatedId = readOptionalRelatedId(payload.relatedId);
  const originalFileName = readRequiredString(payload.originalFileName, "Original file name", 255);
  const fileName = readFileName(payload.fileName);
  const contentType = readContentType(payload.contentType, fileModule);
  const sizeBytes = readSizeBytes(payload.sizeBytes, fileModule);
  const b2FileId = readRequiredString(payload.b2FileId, "B2 file id", 200);
  const b2Key = readRequiredString(payload.b2Key, "B2 key", 1024);
  const publicUrl = readRequiredString(payload.publicUrl, "Public URL", 2048);

  return {
    module: fileModule,
    relatedId,
    originalFileName,
    fileName,
    contentType,
    sizeBytes,
    b2FileId,
    b2Key,
    publicUrl,
  };
}

export const ALLOWED_UPLOAD_MODULES = [
  "fleet",
  "leadership",
  "gallery",
  "rounds",
  "documents",
] as const;

export type AllowedUploadModule = (typeof ALLOWED_UPLOAD_MODULES)[number];

export function assertAllowedUploadModule(fileModule: StoredFileModule): AllowedUploadModule {
  if (
    fileModule === "fleet" ||
    fileModule === "leadership" ||
    fileModule === "gallery" ||
    fileModule === "rounds" ||
    fileModule === "documents"
  ) {
    return fileModule;
  }
  throw new StorageValidationError("Uploads for this module are not enabled yet.");
}

function fileSortTime(record: StoredFileRecord): number {
  if (typeof record.uploadedAt === "string") {
    const ms = Date.parse(record.uploadedAt);
    return Number.isNaN(ms) ? 0 : ms;
  }
  return 0;
}

export async function listStoredFilesByModule(
  fileModule: StoredFileModule,
  limit = 200
): Promise<StoredFileRecord[]> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.files)
    .where("module", "==", fileModule)
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => serializeStoredFileDoc(doc))
    .sort((a, b) => fileSortTime(b) - fileSortTime(a));
}

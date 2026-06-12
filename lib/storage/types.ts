export type StoredFileModule =
  | "announcements"
  | "fleet"
  | "rounds"
  | "leadership"
  | "gallery"
  | "documents";

export type StoredFileRecord = {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  b2FileId: string;
  b2Key: string;
  publicUrl: string;
  uploadedBy: string;
  uploadedByName?: string | null;
  uploadedAt?: unknown;
  module: StoredFileModule;
  relatedId?: string | null;
};

export type CreateB2UploadRequest = {
  module: StoredFileModule;
  relatedId?: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type CreateB2UploadResponse = {
  uploadUrl: string;
  authorizationToken: string;
  fileName: string;
  b2Key: string;
  publicUrl: string;
};

export type CompleteB2UploadRequest = {
  module: StoredFileModule;
  relatedId?: string | null;
  originalFileName: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  b2FileId: string;
  b2Key: string;
  publicUrl: string;
};

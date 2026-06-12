export const STORAGE_ROOT_PREFIX = "fire-storage";

export type StorageVisibility = "internal" | "public";

export type StorageFolderRecord = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  fullPath: string;
  backblazePrefix: string;
  visibility: StorageVisibility;
  createdBy: string;
  createdByName?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type StorageFileRecord = {
  id: string;
  originalFileName: string;
  storedFileName: string;
  displayName: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  folderId: string | null;
  folderPath?: string | null;
  b2Key: string;
  b2FileId: string;
  publicUrl: string;
  visibility: StorageVisibility;
  uploadedBy: string;
  uploadedByName?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  legacySourceId?: string | null;
};

export type StorageFolderTreeNode = StorageFolderRecord & {
  children: StorageFolderTreeNode[];
};

export type StorageBrowseResult = {
  folder: StorageFolderRecord | null;
  breadcrumbs: Array<{ id: string | null; name: string; fullPath: string }>;
  folders: StorageFolderRecord[];
  files: StorageFileRecord[];
};

export type StorageSearchResult = {
  folders: StorageFolderRecord[];
  files: StorageFileRecord[];
};

export type StorageSortField = "name" | "date" | "size" | "type";

export type StorageSortDirection = "asc" | "desc";

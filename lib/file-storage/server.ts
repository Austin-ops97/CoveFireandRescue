import "server-only";

import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { VerifiedServerUser } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  FileStorageValidationError,
  preserveExtensionOnRename,
  slugifyFolderName,
  validateFileDisplayName,
  validateFolderName,
  extractDisplayExtension,
} from "@/lib/file-storage/naming";
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
import { STORAGE_ROOT_PREFIX } from "@/lib/file-storage/types";
import {
  buildStorageFileKey,
  copyB2File,
  deleteB2File,
  extractFileExtension,
  getPublicB2Url,
  isB2Configured,
  uploadBytesToB2,
} from "@/lib/storage/b2";
import { shouldClearMetadataAfterB2DeleteFailure } from "@/lib/storage/b2-errors";
import { MAX_SERVER_UPLOAD_BYTES } from "@/lib/storage/upload-server";
import { serializeStoredFileDoc } from "@/lib/storage/server";

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readVisibility(value: unknown): StorageVisibility {
  return value === "public" ? "public" : "internal";
}

function readParentId(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !value.trim()) {
    throw new FileStorageValidationError("Parent folder id is invalid.");
  }
  return value.trim();
}

export function serializeStorageFolderDoc(doc: DocumentSnapshot): StorageFolderRecord {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    parentId: readParentId(data.parentId),
    fullPath: typeof data.fullPath === "string" ? data.fullPath : "",
    backblazePrefix: typeof data.backblazePrefix === "string" ? data.backblazePrefix : "",
    visibility: readVisibility(data.visibility),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdByName:
      typeof data.createdByName === "string"
        ? data.createdByName
        : data.createdByName === null
          ? null
          : undefined,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function serializeStorageFileDoc(
  doc: DocumentSnapshot,
  folderPath?: string | null
): StorageFileRecord {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    originalFileName:
      typeof data.originalFileName === "string" ? data.originalFileName : "",
    storedFileName: typeof data.storedFileName === "string" ? data.storedFileName : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    fileExtension: typeof data.fileExtension === "string" ? data.fileExtension : "",
    mimeType: typeof data.mimeType === "string" ? data.mimeType : "",
    fileSize: typeof data.fileSize === "number" ? data.fileSize : 0,
    folderId: readParentId(data.folderId),
    folderPath: folderPath ?? null,
    b2Key: typeof data.b2Key === "string" ? data.b2Key : "",
    b2FileId: typeof data.b2FileId === "string" ? data.b2FileId : "",
    publicUrl: typeof data.publicUrl === "string" ? data.publicUrl : "",
    visibility: readVisibility(data.visibility),
    uploadedBy: typeof data.uploadedBy === "string" ? data.uploadedBy : "",
    uploadedByName:
      typeof data.uploadedByName === "string"
        ? data.uploadedByName
        : data.uploadedByName === null
          ? null
          : undefined,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    legacySourceId:
      typeof data.legacySourceId === "string"
        ? data.legacySourceId
        : data.legacySourceId === null
          ? null
          : undefined,
  };
}

function sortTime(value: unknown): number {
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
  }
  return 0;
}

function compareStrings(a: string, b: string, direction: StorageSortDirection): number {
  const result = a.localeCompare(b, undefined, { sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

export function sortFolders(
  folders: StorageFolderRecord[],
  sortBy: StorageSortField,
  direction: StorageSortDirection
): StorageFolderRecord[] {
  const sorted = [...folders];
  sorted.sort((a, b) => {
    if (sortBy === "date") {
      return (sortTime(a.updatedAt ?? a.createdAt) - sortTime(b.updatedAt ?? b.createdAt)) *
        (direction === "asc" ? 1 : -1);
    }
    return compareStrings(a.name, b.name, sortBy === "name" ? direction : "asc");
  });
  return sorted;
}

export function sortFiles(
  files: StorageFileRecord[],
  sortBy: StorageSortField,
  direction: StorageSortDirection
): StorageFileRecord[] {
  const sorted = [...files];
  sorted.sort((a, b) => {
    if (sortBy === "date") {
      return (sortTime(a.updatedAt ?? a.createdAt) - sortTime(b.updatedAt ?? b.createdAt)) *
        (direction === "asc" ? 1 : -1);
    }
    if (sortBy === "size") {
      return (a.fileSize - b.fileSize) * (direction === "asc" ? 1 : -1);
    }
    if (sortBy === "type") {
      return compareStrings(a.fileExtension || a.mimeType, b.fileExtension || b.mimeType, direction);
    }
    return compareStrings(a.displayName, b.displayName, direction);
  });
  return sorted;
}

async function getFolderById(id: string): Promise<StorageFolderRecord | null> {
  const snapshot = await adminDb.collection(COLLECTIONS.storageFolders).doc(id).get();
  if (!snapshot.exists) return null;
  return serializeStorageFolderDoc(snapshot);
}

async function getFileById(id: string): Promise<StorageFileRecord | null> {
  const snapshot = await adminDb.collection(COLLECTIONS.storageFiles).doc(id).get();
  if (!snapshot.exists) return null;
  return serializeStorageFileDoc(snapshot);
}

async function listChildFolders(parentId: string | null): Promise<StorageFolderRecord[]> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.storageFolders)
    .where("parentId", "==", parentId)
    .get();
  return snapshot.docs.map((doc) => serializeStorageFolderDoc(doc));
}

async function listFilesInFolder(folderId: string | null): Promise<StorageFileRecord[]> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.storageFiles)
    .where("folderId", "==", folderId)
    .get();
  return snapshot.docs.map((doc) => serializeStorageFileDoc(doc));
}

async function folderNameExists(parentId: string | null, name: string, excludeId?: string): Promise<boolean> {
  const siblings = await listChildFolders(parentId);
  const normalized = name.trim().toLowerCase();
  return siblings.some(
    (folder) => folder.id !== excludeId && folder.name.trim().toLowerCase() === normalized
  );
}

function buildFolderPaths(name: string, parent: StorageFolderRecord | null): {
  slug: string;
  fullPath: string;
  backblazePrefix: string;
} {
  const slug = slugifyFolderName(name);
  const fullPath = parent ? `${parent.fullPath}/${name.trim()}` : name.trim();
  const backblazePrefix = parent
    ? `${parent.backblazePrefix}/${slug}`
    : `${STORAGE_ROOT_PREFIX}/${slug}`;
  return { slug, fullPath, backblazePrefix };
}

async function buildBreadcrumbs(folder: StorageFolderRecord | null): Promise<
  StorageBrowseResult["breadcrumbs"]
> {
  const crumbs: StorageBrowseResult["breadcrumbs"] = [
    { id: null, name: "File Storage", fullPath: "" },
  ];

  if (!folder) return crumbs;

  const chain: StorageFolderRecord[] = [];
  let current: StorageFolderRecord | null = folder;
  while (current) {
    chain.unshift(current);
    if (!current.parentId) break;
    current = await getFolderById(current.parentId);
  }

  for (const item of chain) {
    crumbs.push({ id: item.id, name: item.name, fullPath: item.fullPath });
  }

  return crumbs;
}

export async function browseStorageFolder(params: {
  folderId: string | null;
  sortBy?: StorageSortField;
  sortDirection?: StorageSortDirection;
}): Promise<StorageBrowseResult> {
  const sortBy = params.sortBy ?? "name";
  const sortDirection = params.sortDirection ?? "asc";

  const folder = params.folderId ? await getFolderById(params.folderId) : null;
  if (params.folderId && !folder) {
    throw new FileStorageValidationError("Folder not found.");
  }

  const folders = sortFolders(await listChildFolders(params.folderId), sortBy, sortDirection);
  const files = sortFiles(await listFilesInFolder(params.folderId), sortBy, sortDirection);
  const breadcrumbs = await buildBreadcrumbs(folder);

  return { folder, breadcrumbs, folders, files };
}

export async function getStorageFolderTree(): Promise<StorageFolderTreeNode[]> {
  const snapshot = await adminDb.collection(COLLECTIONS.storageFolders).get();
  const folders = snapshot.docs.map((doc) => serializeStorageFolderDoc(doc));
  const byParent = new Map<string | null, StorageFolderRecord[]>();

  for (const folder of folders) {
    const key = folder.parentId;
    const list = byParent.get(key) ?? [];
    list.push(folder);
    byParent.set(key, list);
  }

  function buildNodes(parentId: string | null): StorageFolderTreeNode[] {
    const children = byParent.get(parentId) ?? [];
    return children
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
      .map((folder) => ({
        ...folder,
        children: buildNodes(folder.id),
      }));
  }

  return buildNodes(null);
}

export async function createStorageFolder(params: {
  name: string;
  parentId: string | null;
  visibility?: StorageVisibility;
  actor: VerifiedServerUser;
}): Promise<StorageFolderRecord> {
  if (!isB2Configured()) {
    throw new FileStorageValidationError("Backblaze B2 is not configured.");
  }

  const name = validateFolderName(params.name);
  const parent = params.parentId ? await getFolderById(params.parentId) : null;
  if (params.parentId && !parent) {
    throw new FileStorageValidationError("Parent folder not found.");
  }

  if (await folderNameExists(params.parentId, name)) {
    throw new FileStorageValidationError("A folder with this name already exists here.");
  }

  const { slug, fullPath, backblazePrefix } = buildFolderPaths(name, parent);
  const docRef = adminDb.collection(COLLECTIONS.storageFolders).doc();

  await docRef.set({
    name,
    slug,
    parentId: params.parentId,
    fullPath,
    backblazePrefix,
    visibility: params.visibility ?? parent?.visibility ?? "internal",
    createdBy: params.actor.uid,
    createdByName: params.actor.displayName ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return serializeStorageFolderDoc(await docRef.get());
}

export async function renameStorageFolder(params: {
  folderId: string;
  name: string;
  actor: VerifiedServerUser;
}): Promise<StorageFolderRecord> {
  const folder = await getFolderById(params.folderId);
  if (!folder) {
    throw new FileStorageValidationError("Folder not found.");
  }

  const name = validateFolderName(params.name);
  if (name === folder.name) return folder;

  if (await folderNameExists(folder.parentId, name, folder.id)) {
    throw new FileStorageValidationError("A folder with this name already exists here.");
  }

  const parent = folder.parentId ? await getFolderById(folder.parentId) : null;
  const { slug, fullPath, backblazePrefix } = buildFolderPaths(name, parent);

  await updateFolderSubtreePaths({
    folderId: folder.id,
    name,
    slug,
    fullPath,
    backblazePrefix,
  });

  const updated = await getFolderById(folder.id);
  if (!updated) {
    throw new FileStorageValidationError("Folder not found after rename.");
  }
  return updated;
}

async function updateFolderSubtreePaths(params: {
  folderId: string;
  name: string;
  slug: string;
  fullPath: string;
  backblazePrefix: string;
}): Promise<void> {
  const folderRef = adminDb.collection(COLLECTIONS.storageFolders).doc(params.folderId);
  const folderSnap = await folderRef.get();
  if (!folderSnap.exists) {
    throw new FileStorageValidationError("Folder not found.");
  }

  const oldFolder = serializeStorageFolderDoc(folderSnap);

  await folderRef.update({
    name: params.name,
    slug: params.slug,
    fullPath: params.fullPath,
    backblazePrefix: params.backblazePrefix,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const childFolders = await listAllDescendantFolders(params.folderId);

  // Rebuild descendant paths from parent chain for correctness
  const allFoldersSnap = await adminDb.collection(COLLECTIONS.storageFolders).get();
  const folderMap = new Map(
    allFoldersSnap.docs.map((doc) => [doc.id, serializeStorageFolderDoc(doc)])
  );
  folderMap.set(params.folderId, {
    ...oldFolder,
    name: params.name,
    slug: params.slug,
    fullPath: params.fullPath,
    backblazePrefix: params.backblazePrefix,
  });

  function computePaths(id: string): { fullPath: string; backblazePrefix: string } | null {
    const current = folderMap.get(id);
    if (!current) return null;
    if (!current.parentId) {
      return {
        fullPath: current.name,
        backblazePrefix: `${STORAGE_ROOT_PREFIX}/${current.slug}`,
      };
    }
    const parentPaths = computePaths(current.parentId);
    if (!parentPaths) return null;
    return {
      fullPath: `${parentPaths.fullPath}/${current.name}`,
      backblazePrefix: `${parentPaths.backblazePrefix}/${current.slug}`,
    };
  }

  const descendantIds = [params.folderId, ...childFolders.map((f) => f.id)];
  for (const id of descendantIds) {
    const current = folderMap.get(id);
    if (!current) continue;
    const paths = computePaths(id);
    if (!paths) continue;
    await adminDb.collection(COLLECTIONS.storageFolders).doc(id).update({
      fullPath: paths.fullPath,
      backblazePrefix: paths.backblazePrefix,
      updatedAt: FieldValue.serverTimestamp(),
    });
    folderMap.set(id, { ...current, ...paths });
  }

  const filesToMove = await listAllFilesInFolderSubtree(params.folderId);
  for (const file of filesToMove) {
    const folder = file.folderId ? folderMap.get(file.folderId) : null;
    const prefix = folder?.backblazePrefix ?? params.backblazePrefix;
    await relocateStorageFileObject(file, prefix);
  }
}

async function listAllDescendantFolders(folderId: string): Promise<StorageFolderRecord[]> {
  const all = await adminDb.collection(COLLECTIONS.storageFolders).get();
  const folders = all.docs.map((doc) => serializeStorageFolderDoc(doc));
  const childrenByParent = new Map<string, StorageFolderRecord[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const list = childrenByParent.get(folder.parentId) ?? [];
    list.push(folder);
    childrenByParent.set(folder.parentId, list);
  }

  const result: StorageFolderRecord[] = [];
  const queue = [...(childrenByParent.get(folderId) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    queue.push(...(childrenByParent.get(current.id) ?? []));
  }
  return result;
}

async function listAllFilesInFolderSubtree(folderId: string): Promise<StorageFileRecord[]> {
  const descendantFolderIds = new Set([
    folderId,
    ...(await listAllDescendantFolders(folderId)).map((f) => f.id),
  ]);
  const snapshot = await adminDb.collection(COLLECTIONS.storageFiles).get();
  return snapshot.docs
    .map((doc) => serializeStorageFileDoc(doc))
    .filter((file) => file.folderId && descendantFolderIds.has(file.folderId));
}

async function relocateStorageFileObject(
  file: StorageFileRecord,
  destinationPrefix: string
): Promise<void> {
  if (!file.b2FileId || !file.b2Key) return;

  const newKey = buildStorageFileKey({
    backblazePrefix: destinationPrefix,
    originalFileName: file.originalFileName || file.displayName,
  });

  if (newKey === file.b2Key) return;

  const copied = await copyB2File({
    sourceFileId: file.b2FileId,
    sourceFileName: file.b2Key,
    destinationKey: newKey,
  });

  try {
    await deleteB2File({ fileName: file.b2Key, fileId: file.b2FileId });
  } catch (error) {
    console.error("Failed to delete old B2 object after copy:", error);
  }

  await adminDb.collection(COLLECTIONS.storageFiles).doc(file.id).update({
    b2Key: copied.fileName,
    b2FileId: copied.fileId,
    storedFileName: copied.fileName.split("/").pop() ?? file.storedFileName,
    publicUrl: getPublicB2Url(copied.fileName),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function moveStorageFolder(params: {
  folderId: string;
  destinationFolderId: string | null;
  actor: VerifiedServerUser;
}): Promise<StorageFolderRecord> {
  const folder = await getFolderById(params.folderId);
  if (!folder) {
    throw new FileStorageValidationError("Folder not found.");
  }

  if (params.destinationFolderId === folder.id) {
    throw new FileStorageValidationError("Cannot move a folder into itself.");
  }

  const destination = params.destinationFolderId
    ? await getFolderById(params.destinationFolderId)
    : null;
  if (params.destinationFolderId && !destination) {
    throw new FileStorageValidationError("Destination folder not found.");
  }

  if (destination) {
    const descendants = await listAllDescendantFolders(folder.id);
    if (descendants.some((child) => child.id === destination.id)) {
      throw new FileStorageValidationError("Cannot move a folder into its own subfolder.");
    }
  }

  if (await folderNameExists(params.destinationFolderId, folder.name, folder.id)) {
    throw new FileStorageValidationError("A folder with this name already exists in the destination.");
  }

  const parentPaths = destination
    ? { fullPath: destination.fullPath, backblazePrefix: destination.backblazePrefix }
    : null;

  const nextFullPath = parentPaths ? `${parentPaths.fullPath}/${folder.name}` : folder.name;
  const nextPrefix = parentPaths
    ? `${parentPaths.backblazePrefix}/${folder.slug}`
    : `${STORAGE_ROOT_PREFIX}/${folder.slug}`;

  await adminDb.collection(COLLECTIONS.storageFolders).doc(folder.id).update({
    parentId: params.destinationFolderId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await updateFolderSubtreePaths({
    folderId: folder.id,
    name: folder.name,
    slug: folder.slug,
    fullPath: nextFullPath,
    backblazePrefix: nextPrefix,
  });

  const updated = await getFolderById(folder.id);
  if (!updated) {
    throw new FileStorageValidationError("Folder not found after move.");
  }
  return updated;
}

export async function deleteStorageFolder(params: {
  folderId: string;
  recursive: boolean;
  actor: VerifiedServerUser;
}): Promise<void> {
  const folder = await getFolderById(params.folderId);
  if (!folder) {
    throw new FileStorageValidationError("Folder not found.");
  }

  const childFolders = await listChildFolders(folder.id);
  const childFiles = await listFilesInFolder(folder.id);

  if ((childFolders.length > 0 || childFiles.length > 0) && !params.recursive) {
    throw new FileStorageValidationError(
      "Folder is not empty. Delete contents first or use recursive delete."
    );
  }

  if (params.recursive) {
    const descendants = await listAllDescendantFolders(folder.id);
    for (const descendant of [...descendants].reverse()) {
      await deleteStorageFolder({
        folderId: descendant.id,
        recursive: true,
        actor: params.actor,
      });
    }
    const files = await listFilesInFolder(folder.id);
    for (const file of files) {
      await deleteStorageFile({ fileId: file.id, actor: params.actor });
    }
  }

  await adminDb.collection(COLLECTIONS.storageFolders).doc(folder.id).delete();
}

function validateUploadContentType(contentType: string): string {
  const normalized = contentType.trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.includes(normalized as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    throw new FileStorageValidationError(
      "File type is not allowed. Upload PDF, Office documents, images, videos, or plain text."
    );
  }
  return normalized;
}

function resolveUploadPrefix(folder: StorageFolderRecord | null): string {
  return folder?.backblazePrefix ?? STORAGE_ROOT_PREFIX;
}

export async function uploadStorageFile(params: {
  bytes: Uint8Array;
  originalFileName: string;
  contentType: string;
  folderId: string | null;
  visibility?: StorageVisibility;
  actor: VerifiedServerUser;
}): Promise<StorageFileRecord> {
  if (!isB2Configured()) {
    throw new FileStorageValidationError("Backblaze B2 is not configured.");
  }

  if (params.bytes.length > MAX_SERVER_UPLOAD_BYTES) {
    throw new FileStorageValidationError(
      `File is too large for server upload (${(MAX_SERVER_UPLOAD_BYTES / (1024 * 1024)).toFixed(1)} MB max on current hosting).`
    );
  }

  const originalFileName = validateFileDisplayName(params.originalFileName);
  const contentType = validateUploadContentType(params.contentType);
  const folder = params.folderId ? await getFolderById(params.folderId) : null;
  if (params.folderId && !folder) {
    throw new FileStorageValidationError("Destination folder not found.");
  }

  const backblazePrefix = resolveUploadPrefix(folder);
  const b2Key = buildStorageFileKey({ backblazePrefix, originalFileName });
  const storedFileName = b2Key.split("/").pop() ?? originalFileName;
  const fileExtension = extractFileExtension(originalFileName);

  let b2Result: { fileId: string; fileName: string };
  try {
    b2Result = await uploadBytesToB2({
      bytes: params.bytes,
      key: b2Key,
      contentType,
    });
  } catch (error) {
    throw new FileStorageValidationError(
      error instanceof Error ? error.message : "Backblaze upload failed."
    );
  }

  const docRef = adminDb.collection(COLLECTIONS.storageFiles).doc();
  try {
    await docRef.set({
      originalFileName,
      storedFileName,
      displayName: originalFileName,
      fileExtension,
      mimeType: contentType,
      fileSize: params.bytes.length,
      folderId: params.folderId,
      b2Key: b2Result.fileName,
      b2FileId: b2Result.fileId,
      publicUrl: getPublicB2Url(b2Result.fileName),
      visibility: params.visibility ?? folder?.visibility ?? "internal",
      uploadedBy: params.actor.uid,
      uploadedByName: params.actor.displayName ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      legacySourceId: null,
    });
  } catch (error) {
    try {
      await deleteB2File({ fileName: b2Result.fileName, fileId: b2Result.fileId });
    } catch (cleanupError) {
      console.error("Failed to clean up orphaned B2 upload:", cleanupError);
    }
    throw error;
  }

  return serializeStorageFileDoc(await docRef.get(), folder?.fullPath ?? null);
}

export async function renameStorageFile(params: {
  fileId: string;
  displayName: string;
  actor: VerifiedServerUser;
}): Promise<StorageFileRecord> {
  const file = await getFileById(params.fileId);
  if (!file) {
    throw new FileStorageValidationError("File not found.");
  }

  const nextDisplayName = preserveExtensionOnRename({
    currentDisplayName: file.displayName,
    nextName: params.displayName,
  });

  if (nextDisplayName === file.displayName) return file;

  await adminDb.collection(COLLECTIONS.storageFiles).doc(file.id).update({
    displayName: nextDisplayName,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return serializeStorageFileDoc(
    await adminDb.collection(COLLECTIONS.storageFiles).doc(file.id).get()
  );
}

export async function moveStorageFile(params: {
  fileId: string;
  destinationFolderId: string | null;
  actor: VerifiedServerUser;
}): Promise<StorageFileRecord> {
  const file = await getFileById(params.fileId);
  if (!file) {
    throw new FileStorageValidationError("File not found.");
  }

  const destination = params.destinationFolderId
    ? await getFolderById(params.destinationFolderId)
    : null;
  if (params.destinationFolderId && !destination) {
    throw new FileStorageValidationError("Destination folder not found.");
  }

  const prefix = resolveUploadPrefix(destination);
  await relocateStorageFileObject(file, prefix);

  await adminDb.collection(COLLECTIONS.storageFiles).doc(file.id).update({
    folderId: params.destinationFolderId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return serializeStorageFileDoc(
    await adminDb.collection(COLLECTIONS.storageFiles).doc(file.id).get(),
    destination?.fullPath ?? null
  );
}

export async function deleteStorageFile(params: {
  fileId: string;
  actor: VerifiedServerUser;
  metadataOnly?: boolean;
}): Promise<void> {
  const file = await getFileById(params.fileId);
  if (!file) {
    throw new FileStorageValidationError("File not found.");
  }

  if (!params.metadataOnly && file.b2FileId && file.b2Key) {
    try {
      await deleteB2File({ fileName: file.b2Key, fileId: file.b2FileId });
    } catch (error) {
      if (!shouldClearMetadataAfterB2DeleteFailure(error)) {
        throw error;
      }
      console.warn(
        "B2 delete failed for missing or stale object; removing metadata for file:",
        file.id,
        error
      );
    }
  }

  await adminDb.collection(COLLECTIONS.storageFiles).doc(file.id).delete();
  await deleteLinkedLegacyDocumentRecord(file);
}

async function deleteLinkedLegacyDocumentRecord(file: StorageFileRecord): Promise<void> {
  if (file.legacySourceId?.trim()) {
    const legacyRef = adminDb.collection(COLLECTIONS.files).doc(file.legacySourceId.trim());
    const legacySnap = await legacyRef.get();
    if (legacySnap.exists) {
      await legacyRef.delete();
    }
    return;
  }

  if (!file.b2Key) return;

  const legacyMatches = await adminDb
    .collection(COLLECTIONS.files)
    .where("module", "==", "documents")
    .where("b2Key", "==", file.b2Key)
    .limit(1)
    .get();

  if (!legacyMatches.empty) {
    await legacyMatches.docs[0].ref.delete();
  }
}

export async function searchStorage(params: {
  query: string;
  limit?: number;
}): Promise<StorageSearchResult> {
  const q = params.query.trim().toLowerCase();
  if (!q) {
    return { folders: [], files: [] };
  }

  const limit = Math.min(params.limit ?? 50, 100);
  const [folderSnap, fileSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.storageFolders).get(),
    adminDb.collection(COLLECTIONS.storageFiles).get(),
  ]);

  const folders = folderSnap.docs
    .map((doc) => serializeStorageFolderDoc(doc))
    .filter(
      (folder) =>
        folder.name.toLowerCase().includes(q) || folder.fullPath.toLowerCase().includes(q)
    )
    .slice(0, limit);

  const folderMap = new Map(
    folderSnap.docs.map((doc) => [doc.id, serializeStorageFolderDoc(doc)])
  );

  const files = fileSnap.docs
    .map((doc) => {
      const file = serializeStorageFileDoc(doc);
      const folderPath = file.folderId ? folderMap.get(file.folderId)?.fullPath ?? null : null;
      return { ...file, folderPath };
    })
    .filter(
      (file) =>
        file.displayName.toLowerCase().includes(q) ||
        file.originalFileName.toLowerCase().includes(q) ||
        file.fileExtension.toLowerCase().includes(q)
    )
    .slice(0, limit);

  return { folders, files };
}

export async function migrateLegacyDocumentFiles(): Promise<{
  imported: number;
  skipped: number;
}> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.files)
    .where("module", "==", "documents")
    .get();

  let imported = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const legacy = serializeStoredFileDoc(doc);

    const existing = await adminDb
      .collection(COLLECTIONS.storageFiles)
      .where("legacySourceId", "==", legacy.id)
      .limit(1)
      .get();
    if (!existing.empty) {
      skipped += 1;
      continue;
    }

    const displayName = legacy.originalFileName || legacy.fileName;
    const fileExtension = extractDisplayExtension(displayName);

    await adminDb.collection(COLLECTIONS.storageFiles).add({
      originalFileName: legacy.originalFileName || legacy.fileName,
      storedFileName: legacy.fileName,
      displayName,
      fileExtension,
      mimeType: legacy.contentType,
      fileSize: legacy.sizeBytes,
      folderId: null,
      b2Key: legacy.b2Key,
      b2FileId: legacy.b2FileId,
      publicUrl: legacy.publicUrl,
      visibility: "internal",
      uploadedBy: legacy.uploadedBy,
      uploadedByName: legacy.uploadedByName ?? null,
      createdAt: legacy.uploadedAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      legacySourceId: legacy.id,
    });
    imported += 1;
  }

  return { imported, skipped };
}

export { FileStorageValidationError };

import type { VerifiedServerUser } from "@/lib/auth/server";
import type { StorageVisibility } from "@/lib/file-storage/types";

export type FileStoragePermission = "read" | "write" | "delete";

export function canReadFileStorage(user: VerifiedServerUser): boolean {
  return user.active && (user.role === "admin" || user.role === "member");
}

export function canWriteFileStorage(user: VerifiedServerUser): boolean {
  return user.active && user.role === "admin";
}

export function canDeleteFileStorage(user: VerifiedServerUser): boolean {
  return user.active && user.role === "admin";
}

export function assertFileStoragePermission(
  user: VerifiedServerUser,
  permission: FileStoragePermission
): void {
  if (!user.active) {
    throw new Error("User profile is inactive.");
  }

  if (permission === "read" && canReadFileStorage(user)) return;
  if (permission === "write" && canWriteFileStorage(user)) return;
  if (permission === "delete" && canDeleteFileStorage(user)) return;

  throw new Error("Insufficient permissions for file storage.");
}

export function canAccessStorageFile(params: {
  user: VerifiedServerUser | null;
  visibility: StorageVisibility;
}): boolean {
  if (params.visibility === "public") return true;
  if (!params.user) return false;
  return canReadFileStorage(params.user);
}

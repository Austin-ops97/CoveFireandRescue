import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import type { AuditAction } from "@/lib/audit/types";
import type { VerifiedServerUser } from "@/lib/auth/server";
import {
  ServerAuthError,
  requireDashboardAccess,
  requireManageContent,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import {
  assertFileStoragePermission,
  canReadFileStorage,
} from "@/lib/file-storage/permissions";
import { FileStorageValidationError } from "@/lib/file-storage/server";
import type { StorageSortDirection, StorageSortField } from "@/lib/file-storage/types";

export function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string): Response {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function handleFileStorageError(error: unknown): Response {
  if (error instanceof FileStorageValidationError) {
    return badRequest(error.message);
  }
  if (error instanceof ServerAuthError) {
    return serverAuthErrorResponse(error);
  }
  if (error instanceof Error && error.message.trim()) {
    console.error("File storage operation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return serverAuthErrorResponse(error);
}

export async function requireStorageReader(request: Request): Promise<VerifiedServerUser> {
  const user = await requireDashboardAccess(request);
  assertFileStoragePermission(user, "read");
  return user;
}

export async function requireStorageWriter(request: Request): Promise<VerifiedServerUser> {
  const user = await requireManageContent(request);
  assertFileStoragePermission(user, "write");
  return user;
}

export async function requireStorageDeleter(request: Request): Promise<VerifiedServerUser> {
  const user = await requireManageContent(request);
  assertFileStoragePermission(user, "delete");
  return user;
}

export function readSortParams(searchParams: URLSearchParams): {
  sortBy: StorageSortField;
  sortDirection: StorageSortDirection;
} {
  const sortByParam = searchParams.get("sortBy");
  const sortDirectionParam = searchParams.get("sortDirection");

  const sortBy: StorageSortField =
    sortByParam === "date" || sortByParam === "size" || sortByParam === "type"
      ? sortByParam
      : "name";

  const sortDirection: StorageSortDirection =
    sortDirectionParam === "desc" ? "desc" : "asc";

  return { sortBy, sortDirection };
}

export async function logStorageAction(params: {
  action: AuditAction;
  actor: VerifiedServerUser;
  targetType: string;
  targetId: string;
  message: string;
}): Promise<void> {
  await writeAuditLog({
    action: params.action,
    actorUid: params.actor.uid,
    actorRole: params.actor.role!,
    targetType: params.targetType,
    targetId: params.targetId,
    message: params.message,
  });
}

export { canReadFileStorage };

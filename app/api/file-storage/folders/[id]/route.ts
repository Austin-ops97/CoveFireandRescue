import { NextResponse } from "next/server";
import {
  badRequest,
  handleFileStorageError,
  logStorageAction,
  notFound,
  requireStorageDeleter,
  requireStorageWriter,
} from "@/lib/file-storage/api-helpers";
import {
  deleteStorageFolder,
  renameStorageFolder,
  serializeStorageFolderDoc,
} from "@/lib/file-storage/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireStorageWriter(request);
    const { id } = await context.params;

    if (!id?.trim()) {
      return badRequest("Folder id is required.");
    }

    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return badRequest("Folder name is required.");
    }

    const folder = await renameStorageFolder({
      folderId: id.trim(),
      name: body.name,
      actor,
    });

    await logStorageAction({
      action: "file_storage.folder.renamed",
      actor,
      targetType: "storage_folder",
      targetId: folder.id,
      message: `Renamed folder to ${folder.fullPath}`,
    });

    return NextResponse.json({ folder });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireStorageDeleter(request);
    const { id } = await context.params;

    if (!id?.trim()) {
      return badRequest("Folder id is required.");
    }

    const snapshot = await adminDb.collection(COLLECTIONS.storageFolders).doc(id.trim()).get();
    if (!snapshot.exists) {
      return notFound("Folder not found.");
    }

    const folder = serializeStorageFolderDoc(snapshot);
    const { searchParams } = new URL(request.url);
    const recursive = searchParams.get("recursive") === "true";

    await deleteStorageFolder({
      folderId: folder.id,
      recursive,
      actor,
    });

    await logStorageAction({
      action: "file_storage.folder.deleted",
      actor,
      targetType: "storage_folder",
      targetId: folder.id,
      message: `Deleted folder ${folder.fullPath}${recursive ? " (recursive)" : ""}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

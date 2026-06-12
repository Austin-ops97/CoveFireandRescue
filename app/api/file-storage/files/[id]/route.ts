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
  deleteStorageFile,
  renameStorageFile,
  serializeStorageFileDoc,
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
      return badRequest("File id is required.");
    }

    const body = (await request.json()) as { displayName?: string };
    if (!body.displayName?.trim()) {
      return badRequest("File name is required.");
    }

    const file = await renameStorageFile({
      fileId: id.trim(),
      displayName: body.displayName,
      actor,
    });

    await logStorageAction({
      action: "file_storage.file.renamed",
      actor,
      targetType: "storage_file",
      targetId: file.id,
      message: `Renamed file to ${file.displayName}`,
    });

    return NextResponse.json({ file });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireStorageDeleter(request);
    const { id } = await context.params;

    if (!id?.trim()) {
      return badRequest("File id is required.");
    }

    const snapshot = await adminDb.collection(COLLECTIONS.storageFiles).doc(id.trim()).get();
    if (!snapshot.exists) {
      return notFound("File not found.");
    }

    const file = serializeStorageFileDoc(snapshot);
    const { searchParams } = new URL(request.url);
    const metadataOnly = searchParams.get("metadataOnly") === "true";

    await deleteStorageFile({ fileId: file.id, actor, metadataOnly });

    await logStorageAction({
      action: "file_storage.file.deleted",
      actor,
      targetType: "storage_file",
      targetId: file.id,
      message: metadataOnly
        ? `Removed library listing for ${file.displayName} (metadata only)`
        : `Deleted file ${file.displayName}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

import { NextResponse } from "next/server";
import {
  badRequest,
  handleFileStorageError,
  logStorageAction,
  requireStorageWriter,
} from "@/lib/file-storage/api-helpers";
import { uploadStorageFile } from "@/lib/file-storage/server";
import type { StorageVisibility } from "@/lib/file-storage/types";

export async function POST(request: Request) {
  try {
    const actor = await requireStorageWriter(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequest("A file is required.");
    }

    const folderId = formData.get("folderId");
    const visibility = formData.get("visibility");
    const parsedFolderId =
      typeof folderId === "string" && folderId.trim() ? folderId.trim() : null;
    const parsedVisibility =
      visibility === "public" || visibility === "internal"
        ? (visibility as StorageVisibility)
        : undefined;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = await uploadStorageFile({
      bytes,
      originalFileName: file.name,
      contentType: file.type || "application/octet-stream",
      folderId: parsedFolderId,
      visibility: parsedVisibility,
      actor,
    });

    await logStorageAction({
      action: "file_storage.file.uploaded",
      actor,
      targetType: "storage_file",
      targetId: uploaded.id,
      message: `Uploaded ${uploaded.displayName}`,
    });

    return NextResponse.json({ file: uploaded });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

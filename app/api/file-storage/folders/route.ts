import { NextResponse } from "next/server";
import {
  badRequest,
  handleFileStorageError,
  logStorageAction,
  requireStorageWriter,
} from "@/lib/file-storage/api-helpers";
import { createStorageFolder } from "@/lib/file-storage/server";
import type { StorageVisibility } from "@/lib/file-storage/types";

export async function POST(request: Request) {
  try {
    const actor = await requireStorageWriter(request);
    const body = (await request.json()) as {
      name?: string;
      parentId?: string | null;
      visibility?: StorageVisibility;
    };

    if (!body.name?.trim()) {
      return badRequest("Folder name is required.");
    }

    const parentId = body.parentId?.trim() || null;
    const folder = await createStorageFolder({
      name: body.name,
      parentId,
      visibility: body.visibility,
      actor,
    });

    await logStorageAction({
      action: "file_storage.folder.created",
      actor,
      targetType: "storage_folder",
      targetId: folder.id,
      message: `Created folder ${folder.fullPath}`,
    });

    return NextResponse.json({ folder });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

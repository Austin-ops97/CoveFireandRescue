import { NextResponse } from "next/server";
import {
  badRequest,
  handleFileStorageError,
  logStorageAction,
  requireStorageWriter,
} from "@/lib/file-storage/api-helpers";
import { moveStorageFolder } from "@/lib/file-storage/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireStorageWriter(request);
    const { id } = await context.params;

    if (!id?.trim()) {
      return badRequest("Folder id is required.");
    }

    const body = (await request.json()) as { destinationFolderId?: string | null };
    const destinationFolderId = body.destinationFolderId?.trim() || null;

    const folder = await moveStorageFolder({
      folderId: id.trim(),
      destinationFolderId,
      actor,
    });

    await logStorageAction({
      action: "file_storage.folder.moved",
      actor,
      targetType: "storage_folder",
      targetId: folder.id,
      message: `Moved folder to ${folder.fullPath}`,
    });

    return NextResponse.json({ folder });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

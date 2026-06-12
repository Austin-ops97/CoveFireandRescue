import { NextResponse } from "next/server";
import {
  badRequest,
  handleFileStorageError,
  logStorageAction,
  requireStorageWriter,
} from "@/lib/file-storage/api-helpers";
import { moveStorageFile } from "@/lib/file-storage/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireStorageWriter(request);
    const { id } = await context.params;

    if (!id?.trim()) {
      return badRequest("File id is required.");
    }

    const body = (await request.json()) as { destinationFolderId?: string | null };
    const destinationFolderId = body.destinationFolderId?.trim() || null;

    const file = await moveStorageFile({
      fileId: id.trim(),
      destinationFolderId,
      actor,
    });

    await logStorageAction({
      action: "file_storage.file.moved",
      actor,
      targetType: "storage_file",
      targetId: file.id,
      message: `Moved file ${file.displayName}`,
    });

    return NextResponse.json({ file });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

import { NextResponse } from "next/server";
import {
  handleFileStorageError,
  logStorageAction,
  requireStorageWriter,
} from "@/lib/file-storage/api-helpers";
import { migrateLegacyDocumentFiles } from "@/lib/file-storage/server";

export async function POST(request: Request) {
  try {
    const actor = await requireStorageWriter(request);
    const result = await migrateLegacyDocumentFiles();

    await logStorageAction({
      action: "file_storage.migrate",
      actor,
      targetType: "storage",
      targetId: "legacy-documents",
      message: `Imported ${result.imported} legacy files (${result.skipped} skipped)`,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleFileStorageError(error);
  }
}

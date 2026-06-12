import { NextResponse } from "next/server";
import { handleFileStorageError, requireStorageReader } from "@/lib/file-storage/api-helpers";
import { getStorageFolderTree } from "@/lib/file-storage/server";

export async function GET(request: Request) {
  try {
    await requireStorageReader(request);
    const tree = await getStorageFolderTree();
    return NextResponse.json({ tree });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

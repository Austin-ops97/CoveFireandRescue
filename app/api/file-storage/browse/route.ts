import { NextResponse } from "next/server";
import {
  handleFileStorageError,
  readSortParams,
  requireStorageReader,
} from "@/lib/file-storage/api-helpers";
import { browseStorageFolder } from "@/lib/file-storage/server";

export async function GET(request: Request) {
  try {
    await requireStorageReader(request);
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId")?.trim() || null;
    const { sortBy, sortDirection } = readSortParams(searchParams);

    const result = await browseStorageFolder({
      folderId,
      sortBy,
      sortDirection,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleFileStorageError(error);
  }
}

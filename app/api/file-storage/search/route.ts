import { NextResponse } from "next/server";
import { badRequest, handleFileStorageError, requireStorageReader } from "@/lib/file-storage/api-helpers";
import { searchStorage } from "@/lib/file-storage/server";

export async function GET(request: Request) {
  try {
    await requireStorageReader(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return badRequest("Search query is required.");
    }

    const result = await searchStorage({ query });
    return NextResponse.json(result);
  } catch (error) {
    return handleFileStorageError(error);
  }
}

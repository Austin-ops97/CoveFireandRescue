import { NextResponse } from "next/server";
import {
  listStoredFilesByModule,
  StorageValidationError,
} from "@/lib/storage/server";
import type { StoredFileModule } from "@/lib/storage/types";
import { requireManageContent, serverAuthErrorResponse } from "@/lib/auth/server";

const ALLOWED_LIST_MODULES: StoredFileModule[] = ["documents"];

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    await requireManageContent(request);

    const { searchParams } = new URL(request.url);
    const moduleParam = searchParams.get("module")?.trim() ?? "documents";

    if (!ALLOWED_LIST_MODULES.includes(moduleParam as StoredFileModule)) {
      return badRequest("Invalid module.");
    }

    const files = await listStoredFilesByModule(moduleParam as StoredFileModule);

    return NextResponse.json({ files });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return badRequest(error.message);
    }

    return serverAuthErrorResponse(error);
  }
}

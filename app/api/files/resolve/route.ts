import { NextResponse } from "next/server";
import {
  requireDashboardAccess,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { getStoredFilesByIds } from "@/lib/storage/server";

const MAX_IDS = 50;

export async function GET(request: Request) {
  try {
    await requireDashboardAccess(request);

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids")?.trim() ?? "";

    if (!idsParam) {
      return NextResponse.json({ files: {} });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, MAX_IDS);

    const files = await getStoredFilesByIds(ids);

    return NextResponse.json({ files });
  } catch (error) {
    const authResponse = serverAuthErrorResponse(error);
    if (authResponse.status === 401 || authResponse.status === 403) {
      return authResponse;
    }

    console.error("Failed to resolve file metadata:", error);
    return NextResponse.json({ error: "Unable to resolve files right now." }, { status: 500 });
  }
}

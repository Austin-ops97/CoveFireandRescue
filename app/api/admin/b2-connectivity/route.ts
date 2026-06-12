import { NextResponse } from "next/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { authorizeB2, getB2UploadUrl, isB2Configured } from "@/lib/storage/b2";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    if (!isB2Configured()) {
      return NextResponse.json({
        ok: false,
        configured: false,
        error: "One or more B2_* environment variables are missing.",
      });
    }

    await authorizeB2();
    await getB2UploadUrl();

    return NextResponse.json({
      ok: true,
      configured: true,
      authorized: true,
      uploadUrlReady: true,
    });
  } catch (error) {
    const authResponse = serverAuthErrorResponse(error);
    if (authResponse.status === 401 || authResponse.status === 403) {
      return authResponse;
    }

    const message = error instanceof Error ? error.message : "B2 connectivity check failed.";

    return NextResponse.json(
      {
        ok: false,
        configured: isB2Configured(),
        error: message,
      },
      { status: 500 }
    );
  }
}

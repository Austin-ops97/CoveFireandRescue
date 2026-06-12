import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import {
  assertAllowedUploadModule,
  StorageValidationError,
  validateCreateUploadRequest,
} from "@/lib/storage/server";
import { buildB2FileKey, getB2UploadUrl, getPublicB2Url, isB2Configured } from "@/lib/storage/b2";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const actor = await requireServerRole(request, ["admin", "member"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateCreateUploadRequest(body);
      assertAllowedUploadModule(validated.module);
    } catch (error) {
      if (error instanceof StorageValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    if (!isB2Configured()) {
      return NextResponse.json(
        {
          error:
            "Backblaze B2 is not configured. Add B2_* environment variables in Vercel and redeploy.",
        },
        { status: 503 }
      );
    }

    const b2Key = buildB2FileKey({
      module: validated.module,
      relatedId: validated.relatedId,
      fileName: validated.fileName,
    });
    const publicUrl = getPublicB2Url(b2Key);
    const fileName = b2Key.split("/").pop() ?? validated.fileName;

    const { uploadUrl, authorizationToken } = await getB2UploadUrl();

    await writeAuditLog({
      action: "storage.upload.requested",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "storage",
      targetId: validated.relatedId ?? validated.module,
      message: `Requested B2 upload for ${validated.module} (${validated.fileName})`,
    });

    return NextResponse.json({
      uploadUrl,
      authorizationToken,
      fileName,
      b2Key,
      publicUrl,
    });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return badRequest(error.message);
    }

    const authResponse = serverAuthErrorResponse(error);
    if (authResponse.status === 401 || authResponse.status === 403) {
      return authResponse;
    }

    console.error("B2 upload URL request failed:", error);
    return NextResponse.json({ error: "Unable to prepare upload right now." }, { status: 500 });
  }
}

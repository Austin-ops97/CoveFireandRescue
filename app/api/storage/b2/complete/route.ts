import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  assertAllowedUploadModule,
  serializeStoredFileDoc,
  StorageValidationError,
  validateCompleteUploadRequest,
} from "@/lib/storage/server";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let actorUid = "unknown";
  let actorRole: "admin" | "member" = "admin";
  let targetId = "storage";

  try {
    const actor = await requireServerRole(request, ["admin", "member"]);
    actorUid = actor.uid;
    actorRole = actor.role!;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateCompleteUploadRequest(body);
      assertAllowedUploadModule(validated.module);
    } catch (error) {
      if (error instanceof StorageValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    targetId = validated.relatedId ?? validated.module;

    const docRef = adminDb.collection(COLLECTIONS.files).doc();
    const writeData = {
      fileName: validated.fileName,
      originalFileName: validated.originalFileName,
      contentType: validated.contentType,
      sizeBytes: validated.sizeBytes,
      b2FileId: validated.b2FileId,
      b2Key: validated.b2Key,
      publicUrl: validated.publicUrl,
      uploadedBy: actor.uid,
      uploadedByName: actor.displayName ?? actor.email ?? null,
      uploadedAt: FieldValue.serverTimestamp(),
      module: validated.module,
      relatedId: validated.relatedId ?? null,
    };

    await docRef.set(writeData);

    const file = serializeStoredFileDoc(await docRef.get());

    await writeAuditLog({
      action: "storage.upload.completed",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "storage",
      targetId: file.id,
      message: `Completed B2 upload for ${validated.module} (${validated.originalFileName})`,
    });

    return NextResponse.json({ file });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return badRequest(error.message);
    }

    const authResponse = serverAuthErrorResponse(error);
    if (authResponse.status === 401 || authResponse.status === 403) {
      return authResponse;
    }

    console.error("B2 upload completion failed:", error);

    await writeAuditLog({
      action: "storage.upload.failed",
      actorUid,
      actorRole,
      targetType: "storage",
      targetId,
      message: error instanceof Error ? error.message : "B2 upload completion failed.",
    });

    return NextResponse.json({ error: "Unable to complete upload right now." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { StorageValidationError } from "@/lib/storage/server";
import type { StoredFileModule } from "@/lib/storage/types";
import { uploadBytesToB2AndPersist } from "@/lib/storage/upload-server";

const ALLOWED_MODULES: StoredFileModule[] = [
  "fleet",
  "leadership",
  "rounds",
  "documents",
];

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

function readModule(value: FormDataEntryValue | null): StoredFileModule {
  if (typeof value !== "string" || !ALLOWED_MODULES.includes(value as StoredFileModule)) {
    throw new StorageValidationError("Module is invalid.");
  }
  return value as StoredFileModule;
}

function readRelatedId(value: FormDataEntryValue | null): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new StorageValidationError("Related id must be a string or null.");
  }
  const trimmed = value.trim();
  return trimmed || null;
}

export async function POST(request: Request) {
  let actor: VerifiedServerUser | null = null;

  try {
    actor = await requireServerRole(request, ["admin", "member"]);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return badRequest("Invalid upload form data.");
    }

    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return badRequest("A file is required.");
    }

    const fileModule = readModule(formData.get("module"));
    const relatedId = readRelatedId(formData.get("relatedId"));

    const bytes = new Uint8Array(await fileEntry.arrayBuffer());
    const contentType = fileEntry.type.trim() || "application/octet-stream";

    const storedFile = await uploadBytesToB2AndPersist({
      bytes,
      originalFileName: fileEntry.name,
      contentType,
      module: fileModule,
      relatedId,
      uploadedBy: actor.uid,
      uploadedByName: actor.displayName ?? actor.email ?? null,
    });

    await writeAuditLog({
      action: "storage.upload.completed",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "storage",
      targetId: storedFile.id,
      message: `Uploaded ${fileModule} file via server (${fileEntry.name})`,
    });

    return NextResponse.json({ file: storedFile });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return badRequest(error.message);
    }

    const authResponse = serverAuthErrorResponse(error);
    if (authResponse.status === 401 || authResponse.status === 403) {
      return authResponse;
    }

    console.error("B2 server upload failed:", error);

    if (actor) {
      await writeAuditLog({
        action: "storage.upload.failed",
        actorUid: actor.uid,
        actorRole: actor.role!,
        targetType: "storage",
        targetId: "storage",
        message: error instanceof Error ? error.message : "B2 server upload failed.",
      });
    }

    const message =
      error instanceof Error && error.message.startsWith("Backblaze")
        ? error.message
        : "Unable to upload file right now.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

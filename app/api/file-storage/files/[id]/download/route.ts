import { NextResponse } from "next/server";
import { getVerifiedServerUserFromRequest } from "@/lib/auth/server";
import {
  badRequest,
  handleFileStorageError,
  notFound,
  requireStorageReader,
} from "@/lib/file-storage/api-helpers";
import { canAccessStorageFile } from "@/lib/file-storage/permissions";
import { serializeStorageFileDoc } from "@/lib/file-storage/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return badRequest("File id is required.");
    }

    const snapshot = await adminDb.collection(COLLECTIONS.storageFiles).doc(id.trim()).get();
    if (!snapshot.exists) {
      return notFound("File not found.");
    }

    const file = serializeStorageFileDoc(snapshot);

    if (file.visibility === "internal") {
      const user = await requireStorageReader(request);
      if (!canAccessStorageFile({ user, visibility: file.visibility })) {
        return notFound("File not found.");
      }
    } else {
      const user = await getVerifiedServerUserFromRequest(request);
      if (!canAccessStorageFile({ user, visibility: file.visibility })) {
        return notFound("File not found.");
      }
    }

    if (!file.publicUrl) {
      return notFound("Download URL is not available.");
    }

    return NextResponse.redirect(file.publicUrl, { status: 302 });
  } catch (error) {
    return handleFileStorageError(error);
  }
}

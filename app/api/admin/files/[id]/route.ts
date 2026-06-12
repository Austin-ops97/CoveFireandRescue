import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { serializeStoredFileDoc } from "@/lib/storage/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json({ error: "File id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.files).doc(id.trim());
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const file = serializeStoredFileDoc(snapshot);

    if (file.module !== "documents") {
      return NextResponse.json(
        { error: "Only department library files can be deleted here." },
        { status: 400 }
      );
    }

    await docRef.delete();

    await writeAuditLog({
      action: "storage.file.deleted",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "storage",
      targetId: file.id,
      message: `Deleted library file ${file.originalFileName || file.fileName}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

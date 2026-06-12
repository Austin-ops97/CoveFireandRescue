import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { serializeAnnouncementDoc } from "@/lib/announcements/server";
import { requireManageContent, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireManageContent(request);
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json({ error: "Announcement id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.announcements).doc(id.trim());
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    }

    const previous = serializeAnnouncementDoc(existing);

    await docRef.set(
      {
        status: "archived",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await writeAuditLog({
      action: "announcement.archived",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "announcement",
      targetId: id.trim(),
      message: `Archived announcement "${previous.title}" via delete action`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

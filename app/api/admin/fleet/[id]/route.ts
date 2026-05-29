import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { serializeFleetDoc } from "@/lib/fleet/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json({ error: "Fleet unit id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.fleet).doc(id.trim());
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Fleet unit not found." }, { status: 404 });
    }

    const previous = serializeFleetDoc(existing);

    await docRef.set(
      {
        status: "archived",
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await writeAuditLog({
      action: "fleet.archived",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "fleet",
      targetId: id.trim(),
      message: `Archived fleet unit "${previous.name}" via delete action`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

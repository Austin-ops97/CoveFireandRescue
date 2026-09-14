import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { requireManageRoster, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { serializeRosterMemberDoc } from "@/lib/roster/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireManageRoster(request);
    const { id } = await context.params;
    const memberId = id?.trim();

    if (!memberId) {
      return NextResponse.json({ error: "Member id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.rosterMembers).doc(memberId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "Roster member not found." }, { status: 404 });
    }

    const member = serializeRosterMemberDoc(snapshot);
    await docRef.delete();

    await writeAuditLog({
      action: "roster.member_deleted",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "rosterMember",
      targetId: member.id,
      message: `Deleted roster member ${member.unitNumber} ${member.lastName}, ${member.firstName}`,
    });

    return NextResponse.json({ ok: true, id: member.id });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

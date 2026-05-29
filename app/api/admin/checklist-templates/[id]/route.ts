import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { serializeChecklistTemplateDoc } from "@/lib/checklist/server";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;

    if (!id?.trim()) {
      return badRequest("Template id is required.");
    }

    const docRef = adminDb.collection(COLLECTIONS.checklistTemplates).doc(id.trim());
    const existing = await docRef.get();

    if (!existing.exists) {
      return badRequest("Checklist template not found.");
    }

    const previous = serializeChecklistTemplateDoc(existing);

    await docRef.set(
      {
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await writeAuditLog({
      action: "checklist.template.archived",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "checklistTemplate",
      targetId: id,
      message: `Archived checklist template "${previous.name}"`,
    });

    const saved = serializeChecklistTemplateDoc(await docRef.get());

    return NextResponse.json({ template: saved });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

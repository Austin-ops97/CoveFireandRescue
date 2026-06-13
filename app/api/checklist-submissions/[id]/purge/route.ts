import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  ServerAuthError,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { serializeChecklistSubmissionDoc } from "@/lib/checklist/server";
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
      return NextResponse.json({ error: "Submission id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.checklistSubmissions).doc(id.trim());
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const submission = serializeChecklistSubmissionDoc(existing);

    if (!submission.isDeleted) {
      return NextResponse.json(
        { error: "Submission must be in trash before permanent deletion." },
        { status: 400 }
      );
    }

    await docRef.delete();

    await writeAuditLog({
      action: "checklist.submission.purged",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "checklistSubmission",
      targetId: submission.id,
      message: `Permanently deleted checklist submission "${submission.templateName}"`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return serverAuthErrorResponse(error);
    }
    console.error("DELETE /api/checklist-submissions/[id]/purge:", error);
    return NextResponse.json({ error: "Failed to permanently delete submission." }, { status: 500 });
  }
}

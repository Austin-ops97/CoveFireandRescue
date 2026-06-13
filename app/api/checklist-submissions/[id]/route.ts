import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  ServerAuthError,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import {
  serializeChecklistSubmissionDoc,
} from "@/lib/checklist/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { cleanupNotificationsForDeletedSubmission } from "@/lib/notifications/server";

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

    if (submission.isDeleted) {
      return NextResponse.json({ error: "Submission is already deleted." }, { status: 400 });
    }

    await docRef.set(
      {
        isDeleted: true,
        deletedAt: FieldValue.serverTimestamp(),
        deletedBy: actor.uid,
      },
      { merge: true }
    );

    await cleanupNotificationsForDeletedSubmission(submission.id);

    await writeAuditLog({
      action: "checklist.submission.deleted",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "checklistSubmission",
      targetId: submission.id,
      message: `Soft-deleted checklist submission "${submission.templateName}"`,
    });

    const updated = serializeChecklistSubmissionDoc(await docRef.get());
    return NextResponse.json({ submission: updated });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return serverAuthErrorResponse(error);
    }
    console.error("DELETE /api/checklist-submissions/[id]:", error);
    return NextResponse.json({ error: "Failed to delete submission." }, { status: 500 });
  }
}

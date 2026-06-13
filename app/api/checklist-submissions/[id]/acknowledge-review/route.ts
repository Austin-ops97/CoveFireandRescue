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
  serializeChecklistTemplateDoc,
  submissionNeedsReview,
} from "@/lib/checklist/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;

    if (!id?.trim()) {
      return badRequest("Submission id is required.");
    }

    let body: { reviewNote?: string } = {};
    try {
      body = (await request.json()) as { reviewNote?: string };
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let reviewNote: string | null = null;
    if (body.reviewNote !== undefined && body.reviewNote !== null) {
      if (typeof body.reviewNote !== "string") {
        return badRequest("Review note must be a string.");
      }
      reviewNote = body.reviewNote.trim() || null;
      if (reviewNote && reviewNote.length > 2000) {
        return badRequest("Review note must be 2000 characters or fewer.");
      }
    }

    const docRef = adminDb.collection(COLLECTIONS.checklistSubmissions).doc(id.trim());
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const submission = serializeChecklistSubmissionDoc(existing);

    if (submission.isDeleted) {
      return badRequest("Deleted submissions cannot be acknowledged.");
    }

    if (submission.reviewStatus === "acknowledged") {
      return badRequest("This submission has already been reviewed.");
    }

    const templateSnapshot = await adminDb
      .collection(COLLECTIONS.checklistTemplates)
      .doc(submission.templateId)
      .get();
    const template = templateSnapshot.exists
      ? serializeChecklistTemplateDoc(templateSnapshot)
      : null;

    if (!submissionNeedsReview(submission, template)) {
      return badRequest("This submission is not in the review queue.");
    }

    await docRef.set(
      {
        reviewStatus: "acknowledged",
        needsAttention: false,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: actor.uid,
        reviewedByName: actor.displayName ?? actor.email ?? null,
        reviewNote,
      },
      { merge: true }
    );

    const updated = serializeChecklistSubmissionDoc(await docRef.get());

    await writeAuditLog({
      action: "checklist.submission.review_acknowledged",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "checklistSubmission",
      targetId: submission.id,
      message: reviewNote
        ? `Acknowledged review of "${submission.templateName}": ${reviewNote}`
        : `Acknowledged review of "${submission.templateName}"`,
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return serverAuthErrorResponse(error);
    }
    console.error("POST /api/checklist-submissions/[id]/acknowledge-review:", error);
    return NextResponse.json({ error: "Failed to acknowledge review." }, { status: 500 });
  }
}

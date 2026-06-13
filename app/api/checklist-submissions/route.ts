import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireDashboardAccess,
  requireServerRole,
  ServerAuthError,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { serializeFleetDoc } from "@/lib/fleet/server";
import {
  createSubmissionNotification,
} from "@/lib/notifications/server";
import {
  ChecklistValidationError,
  filterSubmissions,
  serializeChecklistSubmissionDoc,
  serializeChecklistTemplateDoc,
  sortSubmissionsNewestFirst,
  stripUndefinedDeep,
  submissionHasAttentionItems,
  validateChecklistSubmissionPayload,
} from "@/lib/checklist/server";
import type {
  ChecklistSubmissionPayload,
  ChecklistTemplateScope,
  SubmissionReviewFilter,
} from "@/lib/checklist/types";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

function handleChecklistSubmissionRouteError(error: unknown, context: string): Response {
  if (error instanceof ServerAuthError) {
    return serverAuthErrorResponse(error);
  }

  if (error instanceof ChecklistValidationError) {
    return badRequest(error.message);
  }

  console.error(`${context}:`, error);

  if (error instanceof Error && error.message.trim()) {
    const message = error.message.toLowerCase();
    if (message.includes("undefined") && message.includes("firestore")) {
      return NextResponse.json(
        {
          error: "Submission data contained invalid values. Please review your answers and try again.",
          code: "invalid_submission_data",
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    {
      error: "Failed to save checklist submission. Please try again.",
      code: "save_failed",
    },
    { status: 500 }
  );
}

async function resolveFleetUnitName(fleetUnitId: string | null): Promise<string | null> {
  if (!fleetUnitId) return null;

  const snapshot = await adminDb.collection(COLLECTIONS.fleet).doc(fleetUnitId).get();
  if (!snapshot.exists) {
    throw new ChecklistValidationError("Selected fleet unit was not found.");
  }

  const fleetUnit = serializeFleetDoc(snapshot);
  if (fleetUnit.status !== "active" || !fleetUnit.active) {
    throw new ChecklistValidationError("Selected fleet unit is not active.");
  }

  return fleetUnit.unitNumber
    ? `${fleetUnit.name} (#${fleetUnit.unitNumber})`
    : fleetUnit.name;
}

export async function GET(request: Request) {
  try {
    const user = await requireDashboardAccess(request);
    const { searchParams } = new URL(request.url);

    const snapshot = await adminDb.collection(COLLECTIONS.checklistSubmissions).limit(300).get();

    let submissions = sortSubmissionsNewestFirst(
      snapshot.docs.map((doc) => serializeChecklistSubmissionDoc(doc))
    );

    if (user.role === "member") {
      submissions = submissions.filter((item) => item.submittedBy === user.uid);
    }

    const scopeParam = searchParams.get("scope")?.trim();
    const scope =
      scopeParam === "fleet" ||
      scopeParam === "station" ||
      scopeParam === "equipment" ||
      scopeParam === "general"
        ? (scopeParam as ChecklistTemplateScope)
        : undefined;

    const deletedOnly = searchParams.get("deletedOnly") === "true";
    const reviewFilterParam = searchParams.get("reviewFilter")?.trim();

    const reviewFilter: SubmissionReviewFilter | undefined =
      reviewFilterParam === "needs_review" ||
      reviewFilterParam === "reviewed" ||
      reviewFilterParam === "deleted"
        ? reviewFilterParam
        : deletedOnly
          ? "deleted"
          : undefined;

    if ((reviewFilter === "deleted" || deletedOnly) && user.role !== "admin") {
      throw new ServerAuthError(403, "insufficient_role", "Insufficient permissions.");
    }

    const templateSnapshot = await adminDb.collection(COLLECTIONS.checklistTemplates).limit(200).get();
    const templatesById = new Map(
      templateSnapshot.docs.map((doc) => {
        const template = serializeChecklistTemplateDoc(doc);
        return [template.id, template] as const;
      })
    );

    const filters = {
      templateId: searchParams.get("templateId")?.trim() || undefined,
      scope,
      relatedFleetUnitId: searchParams.get("relatedFleetUnitId")?.trim() || undefined,
      submittedBy:
        user.role === "admin" || user.role === "editor"
          ? searchParams.get("submittedBy")?.trim() || undefined
          : undefined,
      fromDate: searchParams.get("fromDate")?.trim() || undefined,
      toDate: searchParams.get("toDate")?.trim() || undefined,
      search: searchParams.get("search")?.trim() || undefined,
      attentionOnly: searchParams.get("attentionOnly") === "true",
      reviewFilter,
      deletedOnly,
    };

    submissions = filterSubmissions(submissions, filters, templatesById).slice(0, 200);

    return NextResponse.json({ submissions });
  } catch (error) {
    return handleChecklistSubmissionRouteError(error, "GET /api/checklist-submissions");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireServerRole(request, ["admin", "editor", "member"]);

    let body: ChecklistSubmissionPayload;
    try {
      body = (await request.json()) as ChecklistSubmissionPayload;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const templateRef = adminDb
      .collection(COLLECTIONS.checklistTemplates)
      .doc(body.templateId?.trim() ?? "");
    const templateSnapshot = await templateRef.get();

    if (!templateSnapshot.exists) {
      return badRequest("Checklist template not found.");
    }

    const template = serializeChecklistTemplateDoc(templateSnapshot);

    let validated;
    try {
      validated = validateChecklistSubmissionPayload(body, template);
    } catch (error) {
      if (error instanceof ChecklistValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    let relatedFleetUnitName: string | null = null;
    try {
      relatedFleetUnitName = await resolveFleetUnitName(validated.relatedFleetUnitId);
    } catch (error) {
      if (error instanceof ChecklistValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const docRef = adminDb.collection(COLLECTIONS.checklistSubmissions).doc();
    const hasAttention = submissionHasAttentionItems(
      {
        id: docRef.id,
        templateId: template.id,
        templateName: template.name,
        scope: template.scope,
        submittedBy: actor.uid,
        answers: validated.answers,
        photoFileIds: validated.photoFileIds,
      },
      template
    );

    const writeData: Record<string, unknown> = {
      templateId: template.id,
      templateName: template.name,
      scope: template.scope,
      relatedFleetUnitId: validated.relatedFleetUnitId,
      relatedFleetUnitName,
      submittedBy: actor.uid,
      submittedByName: actor.displayName ?? actor.email ?? null,
      notes: validated.notes,
      answers: stripUndefinedDeep(validated.answers),
      photoFileIds: validated.photoFileIds,
      submittedAt: FieldValue.serverTimestamp(),
      isDeleted: false,
      needsAttention: hasAttention,
      reviewStatus: hasAttention ? "pending" : null,
    };

    await docRef.set(writeData);

    const saved = serializeChecklistSubmissionDoc(await docRef.get());

    await writeAuditLog({
      action: "checklist.submission.created",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "checklistSubmission",
      targetId: saved.id,
      message: `Submitted checklist "${template.name}"${relatedFleetUnitName ? ` for ${relatedFleetUnitName}` : ""}`,
    });

    await createSubmissionNotification(saved, template);

    return NextResponse.json({ submission: saved }, { status: 201 });
  } catch (error) {
    return handleChecklistSubmissionRouteError(error, "POST /api/checklist-submissions");
  }
}

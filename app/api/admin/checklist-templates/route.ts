import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  ChecklistValidationError,
  serializeChecklistTemplateDoc,
  sortTemplatesForAdmin,
  validateChecklistTemplatePayload,
} from "@/lib/checklist/server";
import type { ChecklistTemplateFormState } from "@/lib/checklist/types";
import {
  requireManageContent,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type PostBody = ChecklistTemplateFormState;

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function writeTemplateAudit(
  action: "checklist.template.created" | "checklist.template.updated",
  actor: VerifiedServerUser,
  targetId: string,
  message: string
): Promise<void> {
  await writeAuditLog({
    action,
    actorUid: actor.uid,
    actorRole: actor.role!,
    targetType: "checklistTemplate",
    targetId,
    message,
  });
}

export async function GET(request: Request) {
  try {
    await requireManageContent(request);

    const snapshot = await adminDb.collection(COLLECTIONS.checklistTemplates).limit(100).get();

    const templates = sortTemplatesForAdmin(
      snapshot.docs.map((doc) => serializeChecklistTemplateDoc(doc))
    );

    return NextResponse.json({ templates });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireManageContent(request);

    let body: PostBody;
    try {
      body = (await request.json()) as PostBody;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateChecklistTemplatePayload(body);
    } catch (error) {
      if (error instanceof ChecklistValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.checklistTemplates).doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return badRequest("Checklist template not found.");
      }

      const existingData = existing.data() ?? {};

      const writeData: Record<string, unknown> = {
        name: validated.name,
        description: validated.description,
        scope: validated.scope,
        active: validated.active,
        reusable: validated.reusable,
        sortOrder: validated.sortOrder,
        sections: validated.sections,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (existingData.createdAt !== undefined) {
        writeData.createdAt = existingData.createdAt;
      }

      await docRef.set(writeData, { merge: true });

      const saved = serializeChecklistTemplateDoc(await docRef.get());

      await writeTemplateAudit(
        "checklist.template.updated",
        actor,
        id,
        `Updated checklist template "${saved.name}"`
      );

      return NextResponse.json({ template: saved });
    }

    const docRef = adminDb.collection(COLLECTIONS.checklistTemplates).doc();
    const writeData: Record<string, unknown> = {
      name: validated.name,
      description: validated.description,
      scope: validated.scope,
      active: validated.active,
      reusable: validated.reusable,
      sortOrder: validated.sortOrder,
      sections: validated.sections,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(writeData);

    const saved = serializeChecklistTemplateDoc(await docRef.get());

    await writeTemplateAudit(
      "checklist.template.created",
      actor,
      saved.id,
      `Created checklist template "${saved.name}"`
    );

    return NextResponse.json({ template: saved }, { status: 201 });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

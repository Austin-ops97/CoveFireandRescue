import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { notifyNationalNightOutStatus } from "@/lib/national-night-out/notify";
import {
  NationalNightOutValidationError,
  serializeNationalNightOutRequestDoc,
  validateNationalNightOutStatusUpdate,
} from "@/lib/national-night-out/server";
import { NNO_STATUS_LABELS } from "@/lib/national-night-out/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireServerRole(request, ["admin"]);
    const { id } = await context.params;
    const requestId = id?.trim();

    if (!requestId) {
      return badRequest("Request id is required.");
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.nationalNightOutRequests)
      .doc(requestId)
      .get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "National Night Out request not found." }, { status: 404 });
    }

    return NextResponse.json({ request: serializeNationalNightOutRequestDoc(snapshot) });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;
    const requestDocId = id?.trim();

    if (!requestDocId) {
      return badRequest("Request id is required.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateNationalNightOutStatusUpdate(body);
    } catch (error) {
      if (error instanceof NationalNightOutValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const docRef = adminDb.collection(COLLECTIONS.nationalNightOutRequests).doc(requestDocId);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "National Night Out request not found." }, { status: 404 });
    }

    const previous = serializeNationalNightOutRequestDoc(existing);
    const nextNote = validated.statusNote ?? previous.statusNote;

    await docRef.set(
      {
        status: validated.status,
        statusNote: nextNote,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor.uid,
        updatedByName: actor.displayName ?? actor.email ?? "Administrator",
      },
      { merge: true }
    );

    const notification = await notifyNationalNightOutStatus({
      docRef,
      previousStatus: previous.status,
      nextStatus: validated.status,
      lastNotifiedStatus: previous.lastNotifiedStatus,
      previousNote: previous.statusNote,
      nextNote,
      record: previous,
    });

    const updated = serializeNationalNightOutRequestDoc(await docRef.get());

    await writeAuditLog({
      action: "national_night_out.request_status_updated",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "nationalNightOutRequest",
      targetId: updated.id,
      message: `Updated ${updated.requestId} from ${NNO_STATUS_LABELS[previous.status]} to ${NNO_STATUS_LABELS[updated.status]}`,
    });

    return NextResponse.json({ request: updated, notification });
  } catch (error) {
    if (error instanceof NationalNightOutValidationError) {
      return badRequest(error.message);
    }
    return serverAuthErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;
    const requestDocId = id?.trim();

    if (!requestDocId) {
      return badRequest("Request id is required.");
    }

    const docRef = adminDb.collection(COLLECTIONS.nationalNightOutRequests).doc(requestDocId);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "National Night Out request not found." }, { status: 404 });
    }

    const record = serializeNationalNightOutRequestDoc(existing);
    await docRef.delete();

    await writeAuditLog({
      action: "national_night_out.request_deleted",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "nationalNightOutRequest",
      targetId: record.id,
      message: `Permanently deleted ${record.requestId} from ${record.requesterName}`,
    });

    return NextResponse.json({ deleted: true, id: record.id, requestId: record.requestId });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

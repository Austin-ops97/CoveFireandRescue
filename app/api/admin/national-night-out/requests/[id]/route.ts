import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { sendNationalNightOutStatusEmail } from "@/lib/email/national-night-out";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  NationalNightOutValidationError,
  serializeNationalNightOutRequestDoc,
  shouldSendNationalNightOutStatusNotification,
  validateNationalNightOutStatusUpdate,
} from "@/lib/national-night-out/server";
import { NNO_STATUS_LABELS } from "@/lib/national-night-out/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

function statusPageUrlFromRequest(request: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return `${configured}/national-night-out/status`;
  }

  try {
    const url = new URL(request.url);
    return `${url.origin}/national-night-out/status`;
  } catch {
    return null;
  }
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
    const statusChanged = previous.status !== validated.status;
    const notesChanged =
      validated.adminNotes !== undefined && validated.adminNotes !== previous.adminNotes;

    if (!statusChanged && !notesChanged) {
      return NextResponse.json({ request: previous, notificationSent: false });
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
      updatedByName: actor.displayName ?? actor.email ?? "Administrator",
    };

    if (statusChanged) {
      updatePayload.status = validated.status;
    }

    if (validated.adminNotes !== undefined) {
      updatePayload.adminNotes = validated.adminNotes;
    }

    await docRef.set(updatePayload, { merge: true });

    let updated = serializeNationalNightOutRequestDoc(await docRef.get());

    let notificationSent = false;

    // Notify only when status actually changes to a new value that has not
    // already been emailed for this request (avoids duplicate notifications).
    if (
      statusChanged &&
      shouldSendNationalNightOutStatusNotification({
        previousStatus: previous.status,
        nextStatus: validated.status,
        lastNotifiedStatus: updated.lastNotifiedStatus,
      })
    ) {
      const mailResult = await sendNationalNightOutStatusEmail({
        request: updated,
        status: validated.status,
        statusPageUrl: statusPageUrlFromRequest(request),
      });

      if (mailResult.ok) {
        notificationSent = !mailResult.skipped || mailResult.dryRun;
        await docRef.set(
          {
            lastNotifiedStatus: validated.status,
            lastNotifiedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        updated = serializeNationalNightOutRequestDoc(await docRef.get());

        await writeAuditLog({
          action: "national_night_out.status_notification_sent",
          actorUid: actor.uid,
          actorRole: actor.role!,
          targetType: "nationalNightOutRequest",
          targetId: updated.id,
          message: mailResult.dryRun
            ? `Dry-run status notification for ${updated.requestId} → ${NNO_STATUS_LABELS[validated.status]}`
            : `Sent status notification for ${updated.requestId} → ${NNO_STATUS_LABELS[validated.status]}`,
        });
      }
    }

    if (statusChanged) {
      await writeAuditLog({
        action: "national_night_out.request_status_updated",
        actorUid: actor.uid,
        actorRole: actor.role!,
        targetType: "nationalNightOutRequest",
        targetId: updated.id,
        message: `Updated ${updated.requestId} from ${NNO_STATUS_LABELS[previous.status]} to ${NNO_STATUS_LABELS[updated.status]}`,
      });
    }

    return NextResponse.json({ request: updated, notificationSent });
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

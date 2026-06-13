import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  ServerAuthError,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import {
  serializeChecklistNotificationDoc,
} from "@/lib/notifications/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.checklistNotifications).doc(id.trim());
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const notification = serializeChecklistNotificationDoc(existing);

    if (notification.status !== "unread") {
      return NextResponse.json(
        { error: "Only unread notifications can be acknowledged." },
        { status: 400 }
      );
    }

    await docRef.set(
      {
        status: "acknowledged",
        acknowledgedAt: FieldValue.serverTimestamp(),
        acknowledgedBy: actor.uid,
        acknowledgedByName: actor.displayName ?? actor.email ?? null,
      },
      { merge: true }
    );

    await writeAuditLog({
      action: "checklist.notification.acknowledged",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "checklistSubmission",
      targetId: notification.submissionId,
      message: `Acknowledged notification for "${notification.templateName}"`,
    });

    const updated = serializeChecklistNotificationDoc(await docRef.get());
    return NextResponse.json({ notification: updated });
  } catch (error) {
    if (error instanceof ServerAuthError) {
      return serverAuthErrorResponse(error);
    }
    console.error("POST /api/checklist-notifications/[id]/acknowledge:", error);
    return NextResponse.json({ error: "Failed to acknowledge notification." }, { status: 500 });
  }
}

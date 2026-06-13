import { NextResponse } from "next/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import {
  serializeChecklistNotificationDoc,
  sortNotificationsNewestFirst,
} from "@/lib/notifications/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const snapshot = await adminDb
      .collection(COLLECTIONS.checklistNotifications)
      .limit(300)
      .get();

    const notifications = sortNotificationsNewestFirst(
      snapshot.docs.map((doc) => serializeChecklistNotificationDoc(doc))
    );

    return NextResponse.json({ notifications });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireDashboardAccess,
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  RequestTicketValidationError,
  requestTicketSortTime,
  serializeRequestTicketDoc,
  validateCreateRequestTicketPayload,
} from "@/lib/request-tickets/server";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const user = await requireDashboardAccess(request);

    const query =
      user.role === "admin"
        ? adminDb.collection(COLLECTIONS.requestTickets).limit(500)
        : adminDb
            .collection(COLLECTIONS.requestTickets)
            .where("submittedBy", "==", user.uid)
            .limit(300);

    const snapshot = await query.get();
    const tickets = snapshot.docs
      .map((doc) => serializeRequestTicketDoc(doc))
      .sort((a, b) => requestTicketSortTime(b) - requestTicketSortTime(a));

    return NextResponse.json({ tickets });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireServerRole(request, ["admin", "editor", "viewer", "member"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateCreateRequestTicketPayload(body);
    } catch (error) {
      if (error instanceof RequestTicketValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const docRef = adminDb.collection(COLLECTIONS.requestTickets).doc();
    const ticketNumber = `REQ-${docRef.id.slice(0, 6).toUpperCase()}`;

    await docRef.set({
      ticketNumber,
      ...validated,
      status: "open",
      adminNotificationUnread: true,
      submittedBy: actor.uid,
      submittedByName: actor.displayName ?? actor.email ?? "Department member",
      submittedByEmail: actor.email,
      adminResponse: null,
      updatedBy: null,
      updatedByName: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      resolvedAt: null,
    });

    const ticket = serializeRequestTicketDoc(await docRef.get());

    await writeAuditLog({
      action: "request_ticket.created",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "requestTicket",
      targetId: ticket.id,
      message: `Created ${ticket.ticketNumber}: ${ticket.title}`,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestTicketValidationError) {
      return badRequest(error.message);
    }
    return serverAuthErrorResponse(error);
  }
}

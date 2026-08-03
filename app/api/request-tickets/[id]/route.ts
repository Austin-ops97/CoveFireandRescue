import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  RequestTicketValidationError,
  serializeRequestTicketDoc,
  validateUpdateRequestTicketPayload,
} from "@/lib/request-tickets/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;
    const ticketId = id?.trim();

    if (!ticketId) {
      return badRequest("Request ticket id is required.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateUpdateRequestTicketPayload(body);
    } catch (error) {
      if (error instanceof RequestTicketValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const docRef = adminDb.collection(COLLECTIONS.requestTickets).doc(ticketId);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Request ticket not found." }, { status: 404 });
    }

    const previous = serializeRequestTicketDoc(existing);
    const isResolved = validated.status === "resolved" || validated.status === "closed";

    await docRef.set(
      {
        status: validated.status,
        priority: validated.priority,
        adminResponse: validated.adminResponse,
        adminNotificationUnread: false,
        updatedBy: actor.uid,
        updatedByName: actor.displayName ?? actor.email ?? "Administrator",
        updatedAt: FieldValue.serverTimestamp(),
        resolvedAt: isResolved ? previous.resolvedAt ?? FieldValue.serverTimestamp() : null,
      },
      { merge: true }
    );

    const ticket = serializeRequestTicketDoc(await docRef.get());

    await writeAuditLog({
      action: "request_ticket.updated",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "requestTicket",
      targetId: ticket.id,
      message: `Updated ${ticket.ticketNumber} from ${previous.status} to ${ticket.status}`,
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof RequestTicketValidationError) {
      return badRequest(error.message);
    }
    return serverAuthErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireServerRole(request, ["admin"]);
    const { id } = await context.params;
    const ticketId = id?.trim();

    if (!ticketId) {
      return badRequest("Request ticket id is required.");
    }

    const docRef = adminDb.collection(COLLECTIONS.requestTickets).doc(ticketId);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Request ticket not found." }, { status: 404 });
    }

    const ticket = serializeRequestTicketDoc(existing);
    await docRef.delete();

    await writeAuditLog({
      action: "request_ticket.deleted",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "requestTicket",
      targetId: ticket.id,
      message: `Permanently deleted ${ticket.ticketNumber}: ${ticket.title}`,
    });

    return NextResponse.json({ deleted: true, id: ticket.id });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

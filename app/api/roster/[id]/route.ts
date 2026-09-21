import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { requireManageContent, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { rosterDocId, serializeRosterMemberDoc } from "@/lib/roster/server";
import {
  RosterValidationError,
  findRosterDuplicate,
  validateRosterMemberPayload,
} from "@/lib/roster/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function badRequest(message: string, status = 400): Response {
  return NextResponse.json({ error: message }, { status });
}

function isAlreadyExists(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === 6 || code === "already-exists" || code === "ALREADY_EXISTS";
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireManageContent(request);
    const { id } = await context.params;
    const memberId = id?.trim();
    if (!memberId) {
      return badRequest("Roster member id is required.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateRosterMemberPayload(body);
    } catch (error) {
      if (error instanceof RosterValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const collection = adminDb.collection(COLLECTIONS.rosterMembers);
    const existingRef = collection.doc(memberId);
    const existingSnap = await existingRef.get();
    if (!existingSnap.exists) {
      return NextResponse.json({ error: "Roster member not found." }, { status: 404 });
    }

    const existingMembers = (await collection.limit(200).get()).docs.map((doc) =>
      serializeRosterMemberDoc(doc)
    );
    const duplicate = findRosterDuplicate(existingMembers, validated, memberId);
    if (duplicate) {
      return badRequest(duplicate, 409);
    }

    const nextId = rosterDocId(validated.unitNumber);
    const payload = {
      unitNumber: validated.unitNumber,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone,
      email: validated.email,
      rank: validated.rank,
      activityStatus: validated.activityStatus,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    };

    let savedRef = existingRef;
    if (nextId !== memberId) {
      const nextRef = collection.doc(nextId);
      try {
        const previous = existingSnap.data() ?? {};
        await nextRef.create({
          ...payload,
          createdAt: previous.createdAt ?? FieldValue.serverTimestamp(),
          createdBy: previous.createdBy ?? actor.uid,
        });
      } catch (error) {
        if (isAlreadyExists(error)) {
          return badRequest(`Unit ${validated.unitNumber} is already on the roster.`, 409);
        }
        throw error;
      }
      await existingRef.delete();
      savedRef = nextRef;
    } else {
      await existingRef.set(payload, { merge: true });
    }

    const member = serializeRosterMemberDoc(await savedRef.get());

    await writeAuditLog({
      action: "roster.member_updated",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "rosterMember",
      targetId: member.id,
      message: `Updated roster unit ${member.unitNumber} (${member.firstName} ${member.lastName})`,
    });

    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof RosterValidationError) {
      return badRequest(error.message);
    }
    return serverAuthErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireManageContent(request);
    const { id } = await context.params;
    const memberId = id?.trim();
    if (!memberId) {
      return badRequest("Roster member id is required.");
    }

    const docRef = adminDb.collection(COLLECTIONS.rosterMembers).doc(memberId);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Roster member not found." }, { status: 404 });
    }

    const member = serializeRosterMemberDoc(existing);
    await docRef.delete();

    await writeAuditLog({
      action: "roster.member_deleted",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "rosterMember",
      targetId: member.id,
      message: `Removed roster unit ${member.unitNumber} (${member.firstName} ${member.lastName})`,
    });

    return NextResponse.json({ deleted: true, id: member.id });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

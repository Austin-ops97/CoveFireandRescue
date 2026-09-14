import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireManageRoster,
  requireViewRoster,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  RosterValidationError,
  rosterSortByUnitNumber,
  serializeRosterMemberDoc,
  validateRosterMemberPayload,
} from "@/lib/roster/server";
import type { RosterMemberFormState } from "@/lib/roster/types";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    await requireViewRoster(request);

    const snapshot = await adminDb.collection(COLLECTIONS.rosterMembers).limit(500).get();
    const members = snapshot.docs
      .map((doc) => serializeRosterMemberDoc(doc))
      .sort(rosterSortByUnitNumber);

    return NextResponse.json({ members });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireManageRoster(request);

    let body: RosterMemberFormState;
    try {
      body = (await request.json()) as RosterMemberFormState;
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

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    // Prevent duplicate unit numbers (and identical email collisions).
    const unitQuery = await adminDb
      .collection(COLLECTIONS.rosterMembers)
      .where("unitNumber", "==", validated.unitNumber)
      .limit(5)
      .get();

    const conflictingUnit = unitQuery.docs.find((doc) => doc.id !== id);
    if (conflictingUnit) {
      return badRequest(`Unit number ${validated.unitNumber} is already assigned on the roster.`);
    }

    const emailQuery = await adminDb
      .collection(COLLECTIONS.rosterMembers)
      .where("email", "==", validated.email)
      .limit(5)
      .get();

    const conflictingEmail = emailQuery.docs.find((doc) => {
      if (doc.id === id) return false;
      const data = doc.data();
      const sameFirst =
        typeof data.firstName === "string" &&
        data.firstName.toLowerCase() === validated.firstName.toLowerCase();
      const sameLast =
        typeof data.lastName === "string" &&
        data.lastName.toLowerCase() === validated.lastName.toLowerCase();
      return sameFirst && sameLast;
    });

    if (conflictingEmail) {
      return badRequest(
        "A roster member with the same name and email already exists."
      );
    }

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.rosterMembers).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return badRequest("Roster member not found.");
      }

      await docRef.set(
        {
          ...validated,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor.uid,
        },
        { merge: true }
      );

      const member = serializeRosterMemberDoc(await docRef.get());

      await writeAuditLog({
        action: "roster.member_updated",
        actorUid: actor.uid,
        actorRole: actor.role!,
        targetType: "rosterMember",
        targetId: member.id,
        message: `Updated roster member ${member.unitNumber} ${member.lastName}, ${member.firstName}`,
      });

      return NextResponse.json({ member });
    }

    const docRef = adminDb.collection(COLLECTIONS.rosterMembers).doc();
    await docRef.set({
      ...validated,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
      updatedBy: actor.uid,
    });

    const member = serializeRosterMemberDoc(await docRef.get());

    await writeAuditLog({
      action: "roster.member_created",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "rosterMember",
      targetId: member.id,
      message: `Added roster member ${member.unitNumber} ${member.lastName}, ${member.firstName}`,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof RosterValidationError) {
      return badRequest(error.message);
    }
    return serverAuthErrorResponse(error);
  }
}

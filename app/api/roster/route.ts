import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireDashboardAccess,
  requireManageContent,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { rosterDocId, serializeRosterMemberDoc } from "@/lib/roster/server";
import {
  RosterValidationError,
  findRosterDuplicate,
  validateRosterMemberPayload,
} from "@/lib/roster/validation";

function badRequest(message: string, status = 400): Response {
  return NextResponse.json({ error: message }, { status });
}

function isAlreadyExists(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === 6 || code === "already-exists" || code === "ALREADY_EXISTS";
}

async function loadRosterMembers() {
  const snapshot = await adminDb.collection(COLLECTIONS.rosterMembers).limit(200).get();
  return snapshot.docs.map((doc) => serializeRosterMemberDoc(doc));
}

export async function GET(request: Request) {
  try {
    await requireDashboardAccess(request);
    const members = await loadRosterMembers();
    members.sort((a, b) => a.unitNumber - b.unitNumber);
    return NextResponse.json({ members });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireManageContent(request);

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

    const existing = await loadRosterMembers();
    const duplicate = findRosterDuplicate(existing, validated);
    if (duplicate) {
      return badRequest(duplicate, 409);
    }

    const docRef = adminDb.collection(COLLECTIONS.rosterMembers).doc(rosterDocId(validated.unitNumber));

    try {
      await docRef.create({
        unitNumber: validated.unitNumber,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        email: validated.email,
        rank: validated.rank,
        activityStatus: validated.activityStatus,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: actor.uid,
        updatedBy: actor.uid,
      });
    } catch (error) {
      if (isAlreadyExists(error)) {
        return badRequest(`Unit ${validated.unitNumber} is already on the roster.`, 409);
      }
      throw error;
    }

    const member = serializeRosterMemberDoc(await docRef.get());

    await writeAuditLog({
      action: "roster.member_created",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "rosterMember",
      targetId: member.id,
      message: `Added roster unit ${member.unitNumber} (${member.firstName} ${member.lastName})`,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof RosterValidationError) {
      return badRequest(error.message);
    }
    return serverAuthErrorResponse(error);
  }
}

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  LeadershipValidationError,
  serializeLeadershipDoc,
  sortLeadershipForAdmin,
  validateLeadershipPayload,
} from "@/lib/leadership/server";
import type { LeadershipMemberFormState } from "@/lib/leadership/types";
import {
  requireManageContent,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type PostBody = LeadershipMemberFormState;

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function writeLeadershipAudit(
  action: "leadership.created" | "leadership.updated" | "leadership.archived",
  actor: VerifiedServerUser,
  targetId: string,
  message: string
): Promise<void> {
  await writeAuditLog({
    action,
    actorUid: actor.uid,
    actorRole: actor.role!,
    targetType: "leadership",
    targetId,
    message,
  });
}

export async function GET(request: Request) {
  try {
    await requireManageContent(request);

    const snapshot = await adminDb.collection(COLLECTIONS.leadership).limit(100).get();

    const leadership = sortLeadershipForAdmin(
      snapshot.docs.map((doc) => serializeLeadershipDoc(doc))
    );

    return NextResponse.json({ leadership });
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
      validated = validateLeadershipPayload(body);
    } catch (error) {
      if (error instanceof LeadershipValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.leadership).doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return badRequest("Leadership member not found.");
      }

      const previous = serializeLeadershipDoc(existing);
      const existingData = existing.data() ?? {};

      const writeData: Record<string, unknown> = {
        name: validated.name,
        rank: validated.rank,
        title: validated.title,
        email: validated.email,
        phone: validated.phone,
        bio: validated.bio,
        photoFileId: validated.photoFileId ?? previous.photoFileId ?? null,
        status: validated.status,
        active: validated.active,
        sortOrder: validated.sortOrder,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (existingData.createdAt !== undefined) {
        writeData.createdAt = existingData.createdAt;
      }

      await docRef.set(writeData, { merge: true });

      const saved = serializeLeadershipDoc(await docRef.get());

      await writeLeadershipAudit(
        "leadership.updated",
        actor,
        id,
        `Updated leadership member "${saved.name}"`
      );

      return NextResponse.json({ leadershipMember: saved });
    }

    const docRef = adminDb.collection(COLLECTIONS.leadership).doc();
    const writeData: Record<string, unknown> = {
      name: validated.name,
      rank: validated.rank,
      title: validated.title,
      email: validated.email,
      phone: validated.phone,
      bio: validated.bio,
      photoFileId: validated.photoFileId,
      status: validated.status,
      active: validated.active,
      sortOrder: validated.sortOrder,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(writeData);

    const saved = serializeLeadershipDoc(await docRef.get());

    await writeLeadershipAudit(
      "leadership.created",
      actor,
      saved.id,
      `Created leadership member "${saved.name}"`
    );

    return NextResponse.json({ leadershipMember: saved }, { status: 201 });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

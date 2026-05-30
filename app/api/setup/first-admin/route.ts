import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  ServerAuthError,
  serverAuthErrorResponse,
  verifyFirebaseIdToken,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

async function hasActiveAdmin(): Promise<boolean> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.users)
    .where("role", "==", "admin")
    .limit(25)
    .get();

  return snapshot.docs.some((doc) => doc.data().active === true);
}

export async function POST(request: Request) {
  try {
    const idToken = extractBearerToken(request);
    if (!idToken) {
      throw new ServerAuthError(401, "missing_token", "Authentication required.");
    }

    const decoded = await verifyFirebaseIdToken(idToken);

    if (await hasActiveAdmin()) {
      return NextResponse.json(
        {
          error: "First admin already exists. This setup route is disabled.",
          code: "setup_disabled",
        },
        { status: 403 }
      );
    }

    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const displayName =
      decoded.name ?? decoded.email ?? "First Admin";

    await adminDb.collection(COLLECTIONS.users).doc(uid).set({
      uid,
      email,
      displayName,
      role: "admin",
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog({
      action: "user.profile.created",
      actorUid: uid,
      actorRole: "admin",
      targetType: "user",
      targetId: uid,
      message: "Created first admin profile via bootstrap setup route.",
    });

    return NextResponse.json({
      ok: true,
      message: "First admin profile created.",
    });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

export function PUT() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

export function PATCH() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

export function DELETE() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { writeAuditLog } from "@/lib/audit/server";
import {
  ServerAuthError,
  serverAuthErrorResponse,
  verifyFirebaseIdToken,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

const ROUTE = "POST /api/setup/first-admin";

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function readErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string" || typeof code === "number") {
      return String(code);
    }
  }
  return "unknown";
}

function logSetupFailure(step: string, error: unknown): void {
  console.error(`[${ROUTE}] step failed`, {
    step,
    code: readErrorCode(error),
    message: error instanceof Error ? error.message : "Unknown error",
  });
}

async function checkForActiveAdmin(): Promise<boolean> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.users)
    .where("role", "==", "admin")
    .where("active", "==", true)
    .limit(1)
    .get();

  return !snapshot.empty;
}

async function createFirstAdminProfile(decoded: DecodedIdToken): Promise<void> {
  const uid = decoded.uid;
  const email = decoded.email ?? null;
  const displayName = decoded.name ?? decoded.email ?? "First Admin";

  await adminDb.collection(COLLECTIONS.users).doc(uid).set({
    uid,
    email,
    displayName,
    role: "admin",
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function writeFirstAdminAuditLog(uid: string): Promise<boolean> {
  const logged = await writeAuditLog({
    action: "user.profile.created",
    actorUid: uid,
    actorRole: "admin",
    targetType: "user",
    targetId: uid,
    message: "Created first admin profile via bootstrap setup route.",
  });

  if (!logged) {
    console.error(`[${ROUTE}] step failed`, {
      step: "audit-log",
      code: "audit_log_failed",
      message: "Audit log write failed after profile creation.",
    });
  }

  return logged;
}

export async function POST(request: Request) {
  try {
    const idToken = extractBearerToken(request);
    if (!idToken) {
      throw new ServerAuthError(401, "missing_token", "Authentication required.");
    }

    let decoded: DecodedIdToken;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch (error) {
      if (error instanceof ServerAuthError) {
        logSetupFailure("token-verification", error);
        return NextResponse.json(
          {
            error: "Token verification failed. Sign out, sign in again, and retry.",
            code: error.code,
          },
          { status: error.status }
        );
      }
      logSetupFailure("token-verification", error);
      return NextResponse.json(
        {
          error: "Token verification failed. Sign out, sign in again, and retry.",
          code: "token_verification_failed",
        },
        { status: 401 }
      );
    }

    let activeAdminExists = false;
    try {
      activeAdminExists = await checkForActiveAdmin();
    } catch (error) {
      logSetupFailure("admin-lookup", error);
      return NextResponse.json(
        {
          error:
            "Admin lookup failed. Firebase Admin cannot read the users collection. Check FIREBASE_PRIVATE_KEY formatting and service account permissions in Vercel.",
          code: "admin_lookup_failed",
        },
        { status: 500 }
      );
    }

    if (activeAdminExists) {
      return NextResponse.json(
        {
          error: "First admin already exists. This setup route is disabled.",
          code: "setup_disabled",
        },
        { status: 403 }
      );
    }

    try {
      await createFirstAdminProfile(decoded);
    } catch (error) {
      logSetupFailure("profile-creation", error);
      return NextResponse.json(
        {
          error:
            "Profile creation failed. Firebase Admin could not write users/{uid}. Check service account IAM roles (Firebase Admin or Cloud Datastore User) and Firestore setup.",
          code: "profile_creation_failed",
        },
        { status: 500 }
      );
    }

    const auditLogged = await writeFirstAdminAuditLog(decoded.uid);

    return NextResponse.json({
      ok: true,
      message: auditLogged
        ? "First admin profile created."
        : "First admin profile created. Audit log could not be written, but your profile was saved.",
      auditLogged,
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

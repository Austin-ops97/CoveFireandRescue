import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  requireManageUsers,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  UserAdminError,
  createFirebaseAuthUser,
  generatePasswordResetLink,
  getAuthLastSignIn,
} from "@/lib/users/admin-server";
import { writeUserManagementAudit } from "@/lib/users/audit";
import { buildDisplayName, toManagedUserProfile } from "@/lib/users/profile";
import { parseCreateUserBody } from "@/lib/users/validation";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

function userAdminErrorResponse(error: UserAdminError): Response {
  return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
}

export async function GET(request: Request) {
  try {
    await requireManageUsers(request);

    const snapshot = await adminDb.collection(COLLECTIONS.users).limit(200).get();

    const users = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const lastLoginAt = await getAuthLastSignIn(doc.id);
        return toManagedUserProfile(doc.id, doc.data(), lastLoginAt);
      })
    );

    users.sort((a, b) => {
      const aTime = typeof a.createdAt === "string" ? Date.parse(a.createdAt) : 0;
      const bTime = typeof b.createdAt === "string" ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof UserAdminError) {
      return userAdminErrorResponse(error);
    }
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor: VerifiedServerUser = await requireManageUsers(request);

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const parsed = parseCreateUserBody(body);
    if (parsed instanceof Error) {
      return badRequest(parsed.message);
    }

    const authUser = await createFirebaseAuthUser(parsed);
    const uid = authUser.uid;
    const displayName = buildDisplayName(parsed.firstName, parsed.lastName);

    const profileData: Record<string, unknown> = {
      uid,
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      displayName,
      phone: parsed.phone,
      title: parsed.title,
      role: parsed.role,
      active: parsed.active,
      createdBy: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection(COLLECTIONS.users).doc(uid).set(profileData);

    let passwordSetupLink: string | null = null;
    if (parsed.passwordMode === "reset_link") {
      passwordSetupLink = await generatePasswordResetLink(parsed.email);
    }

    const saved = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
    const lastLoginAt = await getAuthLastSignIn(uid);
    const profile = toManagedUserProfile(uid, saved.data() ?? {}, lastLoginAt);

    await writeUserManagementAudit({
      action: "user.created",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      targetUserEmail: parsed.email,
      details: `Created user ${displayName ?? parsed.email}`,
    });

    return NextResponse.json(
      {
        user: profile,
        message: "User created successfully.",
        passwordSetupLink,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UserAdminError) {
      return userAdminErrorResponse(error);
    }
    return serverAuthErrorResponse(error);
  }
}

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
import { cpanelSupportsUnlimitedQuota } from "@/lib/cpanel/server";
import { provisionDepartmentEmailForUser } from "@/lib/email-provisioning/server";

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

    const parsed = parseCreateUserBody(body, await cpanelSupportsUnlimitedQuota());
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
      departmentEmail: null,
      emailProvisioningStatus: "none",
      emailProvisioningError: null,
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

    let message = "User created successfully.";
    let emailWarning: string | null = null;

    if (parsed.departmentEmail.enabled) {
      try {
        const emailResult = await provisionDepartmentEmailForUser(
          uid,
          {
            emailUsername: parsed.departmentEmail.emailUsername!,
            password: parsed.departmentEmail.password!,
            confirmPassword: parsed.departmentEmail.confirmPassword!,
            quotaMb: parsed.departmentEmail.quotaMb!,
          },
          actor
        );
        message = "User created and department email provisioned successfully.";
        const refreshed = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
        const refreshedProfile = toManagedUserProfile(
          uid,
          refreshed.data() ?? {},
          lastLoginAt
        );

        return NextResponse.json(
          {
            user: refreshedProfile,
            message,
            passwordSetupLink,
            departmentEmail: emailResult.emailAddress,
          },
          { status: 201 }
        );
      } catch (error) {
        emailWarning =
          error instanceof Error
            ? error.message
            : "Department email could not be created.";
        message =
          "User created, but department email provisioning failed. You can retry from the user profile.";

        const refreshed = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
        const refreshedLastLogin = await getAuthLastSignIn(uid);
        const refreshedProfile = toManagedUserProfile(
          uid,
          refreshed.data() ?? {},
          refreshedLastLogin
        );

        return NextResponse.json(
          {
            user: refreshedProfile,
            message,
            passwordSetupLink,
            emailWarning,
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(
      {
        user: profile,
        message,
        passwordSetupLink,
        emailWarning,
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

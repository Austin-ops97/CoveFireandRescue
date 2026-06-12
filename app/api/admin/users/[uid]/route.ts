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
  deleteFirebaseAuthUser,
  ensureNotLastAdmin,
  getAuthLastSignIn,
  setAuthUserDisabled,
  updateAuthUserProfile,
} from "@/lib/users/admin-server";
import { writeUserManagementAudit } from "@/lib/users/audit";
import { buildDisplayName, toManagedUserProfile } from "@/lib/users/profile";
import { parseUpdateUserBody } from "@/lib/users/validation";

type RouteContext = { params: Promise<{ uid: string }> };

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

function notFound(message: string): Response {
  return NextResponse.json({ error: message }, { status: 404 });
}

function userAdminErrorResponse(error: UserAdminError): Response {
  return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor: VerifiedServerUser = await requireManageUsers(request);
    const { uid } = await context.params;

    if (!uid?.trim()) {
      return badRequest("User id is required.");
    }

    const docRef = adminDb.collection(COLLECTIONS.users).doc(uid);
    const existing = await docRef.get();
    if (!existing.exists) {
      return notFound("User profile not found.");
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const parsed = parseUpdateUserBody(body);
    if (parsed instanceof Error) {
      return badRequest(parsed.message);
    }

    if (actor.uid === uid && parsed.role !== "admin") {
      return badRequest("You cannot remove your own administrator role.");
    }

    await ensureNotLastAdmin(uid, parsed.role, parsed.active);

    const existingData = existing.data() ?? {};
    const previousRole = existingData.role;
    const displayName = buildDisplayName(parsed.firstName, parsed.lastName);

    await updateAuthUserProfile(uid, {
      displayName: displayName ?? undefined,
      disabled: !parsed.active,
    });

    await docRef.set(
      {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        displayName,
        phone: parsed.phone,
        title: parsed.title,
        role: parsed.role,
        active: parsed.active,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const saved = await docRef.get();
    const lastLoginAt = await getAuthLastSignIn(uid);
    const profile = toManagedUserProfile(uid, saved.data() ?? {}, lastLoginAt);

    await writeUserManagementAudit({
      action: previousRole !== parsed.role ? "user.role_changed" : "user.updated",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      targetUserEmail: profile.email,
      details:
        previousRole !== parsed.role
          ? `Changed role from ${String(previousRole)} to ${parsed.role}`
          : `Updated user ${displayName ?? uid}`,
    });

    if (!parsed.active && existingData.active === true) {
      await writeUserManagementAudit({
        action: "user.disabled",
        actorUid: actor.uid,
        actorRole: actor.role!,
        targetUserId: uid,
        targetUserEmail: profile.email,
        details: `Disabled user ${displayName ?? uid}`,
      });
    }

    return NextResponse.json({ user: profile, message: "User updated successfully." });
  } catch (error) {
    if (error instanceof UserAdminError) {
      return userAdminErrorResponse(error);
    }
    return serverAuthErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor: VerifiedServerUser = await requireManageUsers(request);
    const { uid } = await context.params;

    if (!uid?.trim()) {
      return badRequest("User id is required.");
    }

    if (actor.uid === uid) {
      return badRequest("You cannot delete your own account.");
    }

    const docRef = adminDb.collection(COLLECTIONS.users).doc(uid);
    const existing = await docRef.get();
    if (!existing.exists) {
      return notFound("User profile not found.");
    }

    const existingData = existing.data() ?? {};
    const url = new URL(request.url);
    const permanent = url.searchParams.get("permanent") === "true";

    if (existingData.role === "admin" && existingData.active === true) {
      await ensureNotLastAdmin(uid, "member", false);
    }

    if (permanent) {
      await deleteFirebaseAuthUser(uid);
      await docRef.delete();

      await writeUserManagementAudit({
        action: "user.deleted",
        actorUid: actor.uid,
        actorRole: actor.role!,
        targetUserId: uid,
        targetUserEmail:
          typeof existingData.email === "string" ? existingData.email : null,
        details: "Permanently deleted user",
      });

      return NextResponse.json({ message: "User permanently deleted." });
    }

    await setAuthUserDisabled(uid, true);
    await docRef.set(
      {
        active: false,
        disabledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await writeUserManagementAudit({
      action: "user.disabled",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      targetUserEmail:
        typeof existingData.email === "string" ? existingData.email : null,
      details: "Disabled user (soft delete)",
    });

    return NextResponse.json({ message: "User disabled successfully." });
  } catch (error) {
    if (error instanceof UserAdminError) {
      return userAdminErrorResponse(error);
    }
    return serverAuthErrorResponse(error);
  }
}

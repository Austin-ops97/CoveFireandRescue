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
  generatePasswordResetLink,
  setTemporaryPassword,
} from "@/lib/users/admin-server";
import { writeUserManagementAudit } from "@/lib/users/audit";
import { validateTemporaryPassword } from "@/lib/users/validation";

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

export async function POST(request: Request, context: RouteContext) {
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

    const email =
      typeof existing.data()?.email === "string" ? existing.data()!.email : null;
    if (!email) {
      return badRequest("User does not have an email address on file.");
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const mode = body.mode === "reset_link" ? "reset_link" : "temporary";
    let passwordSetupLink: string | null = null;

    if (mode === "reset_link") {
      passwordSetupLink = await generatePasswordResetLink(email);
    } else {
      const password = validateTemporaryPassword(body.temporaryPassword);
      if (password instanceof Error) {
        return badRequest(password.message);
      }
      await setTemporaryPassword(uid, password);
    }

    await writeUserManagementAudit({
      action: "user.password_reset",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      targetUserEmail: email,
      details:
        mode === "reset_link"
          ? "Generated password setup link"
          : "Set temporary password",
    });

    return NextResponse.json({
      message:
        mode === "reset_link"
          ? "Password setup link generated."
          : "Temporary password set successfully.",
      passwordSetupLink,
    });
  } catch (error) {
    if (error instanceof UserAdminError) {
      return userAdminErrorResponse(error);
    }
    return serverAuthErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import {
  requireManageUsers,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { cpanelSupportsUnlimitedQuota } from "@/lib/cpanel/server";
import { parseCreatePortalUserBody } from "@/lib/email-provisioning/validation";
import { UserAdminError, getAuthLastSignIn } from "@/lib/users/admin-server";
import {
  CreateUserError,
  createPortalUserWithDepartmentEmail,
  mapCreateUserError,
} from "@/lib/users/create-user-server";
import { toManagedUserProfile } from "@/lib/users/profile";

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
        const lastLoginAt = doc.id.startsWith("alias_") || doc.id.startsWith("pending_")
          ? null
          : await getAuthLastSignIn(doc.id);
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

    const parsed = parseCreatePortalUserBody(body, await cpanelSupportsUnlimitedQuota());
    if (parsed instanceof Error) {
      return badRequest(parsed.message);
    }

    const result = await createPortalUserWithDepartmentEmail(parsed, actor);

    return NextResponse.json(
      {
        user: result.user,
        message: result.message,
        departmentEmail: result.departmentEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    const mapped = mapCreateUserError(error);
    if (mapped) return mapped;
    if (error instanceof CreateUserError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    if (error instanceof UserAdminError) {
      return userAdminErrorResponse(error);
    }
    return serverAuthErrorResponse(error);
  }
}

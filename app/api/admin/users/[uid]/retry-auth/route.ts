import { NextResponse } from "next/server";
import {
  requireManageUsers,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import {
  CreateUserError,
  mapCreateUserError,
  retryPendingPortalUserCreation,
} from "@/lib/users/create-user-server";
import { validateStrongPassword } from "@/lib/email-provisioning/validation";

type RouteContext = { params: Promise<{ uid: string }> };

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor: VerifiedServerUser = await requireManageUsers(request);
    const { uid } = await context.params;

    if (!uid?.trim()) {
      return badRequest("User id is required.");
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const password = validateStrongPassword(body.password);
    if (password instanceof Error) {
      return badRequest(password.message);
    }

    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    if (password !== confirmPassword) {
      return badRequest("Password and confirm password must match.");
    }

    const result = await retryPendingPortalUserCreation(uid, password, actor);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapCreateUserError(error);
    if (mapped) return mapped;
    if (error instanceof CreateUserError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return serverAuthErrorResponse(error);
  }
}

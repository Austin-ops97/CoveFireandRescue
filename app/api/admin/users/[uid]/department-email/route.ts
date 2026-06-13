import { NextResponse } from "next/server";
import {
  requireManageUsers,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { cpanelSupportsUnlimitedQuota } from "@/lib/cpanel/server";
import {
  EmailProvisioningError,
  mapEmailProvisioningError,
  provisionDepartmentEmailForUser,
} from "@/lib/email-provisioning/server";
import { parseDepartmentEmailBody } from "@/lib/email-provisioning/validation";

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

    const supportsUnlimited = await cpanelSupportsUnlimitedQuota();
    const parsed = parseDepartmentEmailBody(body, supportsUnlimited);
    if (parsed instanceof Error) {
      return badRequest(parsed.message);
    }

    const result = await provisionDepartmentEmailForUser(uid, parsed, actor);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = mapEmailProvisioningError(error);
    if (mapped) return mapped;
    if (error instanceof EmailProvisioningError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    return serverAuthErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireManageUsers, serverAuthErrorResponse } from "@/lib/auth/server";
import { getEmailProvisioningConfig } from "@/lib/email-provisioning/server";

export async function GET(request: Request) {
  try {
    await requireManageUsers(request);
    const config = await getEmailProvisioningConfig();
    return NextResponse.json(config);
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

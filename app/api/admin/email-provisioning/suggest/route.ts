import { NextResponse } from "next/server";
import { requireManageUsers, serverAuthErrorResponse } from "@/lib/auth/server";
import { getCpanelEmailDomain } from "@/lib/cpanel/server";
import {
  findFirstAvailableMemberEmailUsername,
  isDepartmentEmailUsernameTaken,
} from "@/lib/email-provisioning/availability";
import {
  buildDepartmentEmailAddress,
  suggestDepartmentEmailUsername,
} from "@/lib/email-provisioning/usernames";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    await requireManageUsers(request);

    const url = new URL(request.url);
    const firstName = url.searchParams.get("firstName")?.trim() ?? "";
    const lastName = url.searchParams.get("lastName")?.trim() ?? "";
    const username = url.searchParams.get("username")?.trim().toLowerCase() ?? "";

    const domain = getCpanelEmailDomain();
    if (!domain) {
      return NextResponse.json({
        configured: false,
        domain: null,
        username: null,
        email: null,
        available: false,
      });
    }

    if (username) {
      const available = !(await isDepartmentEmailUsernameTaken(username));
      return NextResponse.json({
        configured: true,
        domain,
        username,
        email: buildDepartmentEmailAddress(username, domain),
        available,
      });
    }

    if (!firstName || !lastName) {
      return badRequest("First name and last name are required.");
    }

    const suggested = suggestDepartmentEmailUsername(firstName, lastName);
    const availableUsername =
      (await findFirstAvailableMemberEmailUsername(firstName, lastName)) ?? suggested;

    return NextResponse.json({
      configured: true,
      domain,
      username: availableUsername,
      email: buildDepartmentEmailAddress(availableUsername, domain),
      available: !(await isDepartmentEmailUsernameTaken(availableUsername)),
    });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

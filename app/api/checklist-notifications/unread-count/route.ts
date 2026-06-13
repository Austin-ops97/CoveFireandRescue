import { NextResponse } from "next/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { countUnreadNotifications } from "@/lib/notifications/server";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const count = await countUnreadNotifications();

    return NextResponse.json({ count });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

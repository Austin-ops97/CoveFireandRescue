import { NextResponse } from "next/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    await adminDb.collection(COLLECTIONS.users).limit(1).get();

    return NextResponse.json({
      ok: true,
      firebaseAdmin: true,
      firestore: true,
    });
  } catch (error) {
    const authResponse = serverAuthErrorResponse(error);
    if (authResponse.status !== 500) {
      return authResponse;
    }

    console.error("Admin connectivity check failed:", error);

    const message =
      error instanceof Error ? error.message : "Connectivity check failed.";

    return NextResponse.json(
      {
        ok: false,
        firebaseAdmin: false,
        firestore: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

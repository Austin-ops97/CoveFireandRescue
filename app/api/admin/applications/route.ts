import { NextResponse } from "next/server";
import { applicationSortTime, serializeApplicationDoc } from "@/lib/applications/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const snapshot = await adminDb.collection(COLLECTIONS.applications).limit(200).get();

    const applications = snapshot.docs
      .map((doc) => serializeApplicationDoc(doc))
      .sort((a, b) => applicationSortTime(b) - applicationSortTime(a));

    return NextResponse.json({ applications });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

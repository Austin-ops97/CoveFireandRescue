import { NextResponse } from "next/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  nationalNightOutSortTime,
  serializeNationalNightOutRequestDoc,
} from "@/lib/national-night-out/server";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const snapshot = await adminDb
      .collection(COLLECTIONS.nationalNightOutRequests)
      .limit(500)
      .get();

    const requests = snapshot.docs
      .map((doc) => serializeNationalNightOutRequestDoc(doc))
      .sort((a, b) => nationalNightOutSortTime(b) - nationalNightOutSortTime(a));

    return NextResponse.json({ requests });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

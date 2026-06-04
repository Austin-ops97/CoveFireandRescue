import { NextResponse } from "next/server";
import { contactSortTime, serializeContactDoc } from "@/lib/contact/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const snapshot = await adminDb.collection(COLLECTIONS.contactSubmissions).limit(200).get();

    const submissions = snapshot.docs
      .map((doc) => serializeContactDoc(doc))
      .sort((a, b) => contactSortTime(b) - contactSortTime(a));

    return NextResponse.json({ submissions });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

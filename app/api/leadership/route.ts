import { NextResponse } from "next/server";
import {
  attachLeadershipPhotoUrls,
  serializeLeadershipDoc,
  sortLeadershipForPublic,
} from "@/lib/leadership/server";
import type { LeadershipMemberRecord } from "@/lib/leadership/types";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.leadership)
      .where("status", "==", "active")
      .where("active", "==", true)
      .limit(100)
      .get();

    const leadership = snapshot.docs
      .map((doc) => serializeLeadershipDoc(doc))
      .filter((item) => item.status === "active" && item.active === true);

    const sorted = sortLeadershipForPublic(leadership).slice(0, 100);
    const withPhotos = await attachLeadershipPhotoUrls(sorted);

    return NextResponse.json({ leadership: withPhotos satisfies LeadershipMemberRecord[] });
  } catch (error) {
    console.error("Failed to load public leadership:", error);
    return NextResponse.json({ error: "Unable to load leadership right now." }, { status: 500 });
  }
}

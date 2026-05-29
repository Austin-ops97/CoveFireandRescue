import { NextResponse } from "next/server";
import {
  serializeAnnouncementDoc,
  sortAnnouncementsForDisplay,
} from "@/lib/announcements/server";
import type { AnnouncementRecord } from "@/lib/announcements/types";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.announcements)
      .where("status", "==", "published")
      .limit(50)
      .get();

    const announcements = snapshot.docs
      .map((doc) => serializeAnnouncementDoc(doc))
      .filter((item) => item.status === "published");

    const sorted = sortAnnouncementsForDisplay(announcements).slice(0, 50);

    return NextResponse.json({ announcements: sorted satisfies AnnouncementRecord[] });
  } catch (error) {
    console.error("Failed to load public announcements:", error);
    return NextResponse.json(
      { error: "Unable to load announcements right now." },
      { status: 500 }
    );
  }
}

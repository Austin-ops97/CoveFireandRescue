import { NextResponse } from "next/server";
import { gallerySortTime, serializeGalleryDoc } from "@/lib/gallery/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.gallery)
      .where("visible", "==", true)
      .limit(100)
      .get();

    const items = snapshot.docs
      .map((doc) => serializeGalleryDoc(doc))
      .filter((item) => item.visible)
      .sort((a, b) => gallerySortTime(b) - gallerySortTime(a));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load public gallery:", error);
    return NextResponse.json({ error: "Unable to load gallery right now." }, { status: 500 });
  }
}

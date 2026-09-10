import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { serializeNationalNightOutSettings } from "@/lib/national-night-out/server";
import { NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID } from "@/lib/national-night-out/types";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.siteSettings)
      .doc(NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID)
      .get();

    const settings = serializeNationalNightOutSettings(
      snapshot.exists ? (snapshot.data() as Record<string, unknown>) : null
    );

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to load National Night Out settings:", error);
    return NextResponse.json(
      { error: "Unable to load National Night Out settings right now." },
      { status: 500 }
    );
  }
}

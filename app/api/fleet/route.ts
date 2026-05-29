import { NextResponse } from "next/server";
import {
  attachFleetPrimaryImageUrls,
  serializeFleetDoc,
  sortFleetForPublic,
} from "@/lib/fleet/server";
import type { FleetUnitRecord } from "@/lib/fleet/types";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.fleet)
      .where("status", "==", "active")
      .where("active", "==", true)
      .limit(100)
      .get();

    const fleet = snapshot.docs
      .map((doc) => serializeFleetDoc(doc))
      .filter((item) => item.status === "active" && item.active === true);

    const sorted = sortFleetForPublic(fleet).slice(0, 100);
    const withImages = await attachFleetPrimaryImageUrls(sorted);

    return NextResponse.json({ fleet: withImages satisfies FleetUnitRecord[] });
  } catch (error) {
    console.error("Failed to load public fleet:", error);
    return NextResponse.json({ error: "Unable to load fleet right now." }, { status: 500 });
  }
}

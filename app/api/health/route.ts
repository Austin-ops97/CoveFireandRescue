import { NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isB2Configured } from "@/lib/storage/b2";
import { isCpanelConfigured } from "@/lib/cpanel/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "cove-fire-rescue",
    firebaseClientConfigured: isFirebaseConfigured(),
    firebaseAdminConfigured: isFirebaseAdminConfigured(),
    b2Configured: isB2Configured(),
    cpanelConfigured: isCpanelConfigured(),
  });
}

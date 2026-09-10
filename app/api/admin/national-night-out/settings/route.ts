import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  NationalNightOutValidationError,
  serializeNationalNightOutSettings,
  validateNationalNightOutSettingsUpdate,
} from "@/lib/national-night-out/server";
import { NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID } from "@/lib/national-night-out/types";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const snapshot = await adminDb
      .collection(COLLECTIONS.siteSettings)
      .doc(NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID)
      .get();

    const settings = serializeNationalNightOutSettings(
      snapshot.exists ? (snapshot.data() as Record<string, unknown>) : null
    );

    return NextResponse.json({ settings });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireServerRole(request, ["admin"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    let validated;
    try {
      validated = validateNationalNightOutSettingsUpdate(body);
    } catch (error) {
      if (error instanceof NationalNightOutValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const docRef = adminDb
      .collection(COLLECTIONS.siteSettings)
      .doc(NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID);

    await docRef.set(
      {
        enabled: validated.enabled,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: true }
    );

    const snapshot = await docRef.get();
    const settings = serializeNationalNightOutSettings(
      snapshot.exists ? (snapshot.data() as Record<string, unknown>) : null
    );

    await writeAuditLog({
      action: "national_night_out.settings_updated",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "siteSettings",
      targetId: NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID,
      message: `National Night Out requests ${validated.enabled ? "enabled" : "disabled"}`,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof NationalNightOutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return serverAuthErrorResponse(error);
  }
}

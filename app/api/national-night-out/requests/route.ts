import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { sendNationalNightOutStatusEmail } from "@/lib/email/national-night-out";
import {
  assertWithinNationalNightOutRateLimit,
  getClientIpFromRequest,
} from "@/lib/national-night-out/rate-limit";
import {
  NationalNightOutValidationError,
  buildNationalNightOutRequestId,
  serializeNationalNightOutRequestDoc,
  serializeNationalNightOutSettings,
  validateNationalNightOutPayload,
} from "@/lib/national-night-out/server";
import { NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID } from "@/lib/national-night-out/types";

function statusPageUrlFromRequest(request: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return `${configured}/national-night-out/status`;
  }

  try {
    const url = new URL(request.url);
    return `${url.origin}/national-night-out/status`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const settingsSnapshot = await adminDb
      .collection(COLLECTIONS.siteSettings)
      .doc(NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID)
      .get();

    const settings = serializeNationalNightOutSettings(
      settingsSnapshot.exists ? (settingsSnapshot.data() as Record<string, unknown>) : null
    );

    if (!settings.enabled) {
      return NextResponse.json(
        {
          error:
            "National Night Out requests are not currently being accepted. Please check back later.",
        },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Silent honeypot acceptance — look successful to bots without storing data.
    if (
      body &&
      typeof body === "object" &&
      typeof (body as Record<string, unknown>).website === "string" &&
      String((body as Record<string, unknown>).website).trim()
    ) {
      return NextResponse.json(
        {
          id: "ignored",
          requestId: "NNO-IGNORED",
          message:
            "Your National Night Out request has been submitted. This request does not guarantee a department visit. The department will review your request and determine availability.",
        },
        { status: 201 }
      );
    }

    let validated;
    try {
      validated = validateNationalNightOutPayload(body);
    } catch (error) {
      if (error instanceof NationalNightOutValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const clientIp = getClientIpFromRequest(request);
    try {
      assertWithinNationalNightOutRateLimit(`${clientIp}:${validated.email}`);
    } catch {
      return NextResponse.json(
        {
          error:
            "Too many requests were submitted recently. Please wait a while before trying again.",
        },
        { status: 429 }
      );
    }

    const docRef = adminDb.collection(COLLECTIONS.nationalNightOutRequests).doc();
    const requestId = buildNationalNightOutRequestId(docRef.id);

    await docRef.set({
      requestId,
      requesterName: validated.requesterName,
      phone: validated.phone,
      email: validated.email,
      neighborhood: validated.neighborhood,
      address: validated.address,
      city: validated.city,
      zipCode: validated.zipCode,
      preferredTime: validated.preferredTime,
      estimatedAttendance: validated.estimatedAttendance,
      accessInstructions: validated.accessInstructions ?? "",
      comments: validated.comments ?? "",
      disclaimerAccepted: true,
      status: "submitted",
      adminNotes: "",
      lastNotifiedStatus: null,
      lastNotifiedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const record = serializeNationalNightOutRequestDoc(await docRef.get());

    // Confirmation email for newly submitted requests (skipped in dry-run / without API key).
    const mailResult = await sendNationalNightOutStatusEmail({
      request: record,
      status: "submitted",
      statusPageUrl: statusPageUrlFromRequest(request),
    });

    if (mailResult.ok && !mailResult.skipped) {
      await docRef.set(
        {
          lastNotifiedStatus: "submitted",
          lastNotifiedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else if (mailResult.ok && mailResult.dryRun) {
      // In dry-run, still record that we would have notified for this status
      // so duplicate prevention logic can be exercised in tests/dev.
      await docRef.set(
        {
          lastNotifiedStatus: "submitted",
          lastNotifiedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return NextResponse.json(
      {
        id: docRef.id,
        requestId,
        message:
          "Your National Night Out request has been submitted. This request does not guarantee a department visit. The department will review your request and determine availability.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save National Night Out request:", error);
    return NextResponse.json(
      { error: "Unable to submit your request right now. Please try again later." },
      { status: 500 }
    );
  }
}

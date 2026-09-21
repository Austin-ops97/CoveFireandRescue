import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  assertWithinStatusLookupRateLimit,
  getClientIpFromRequest,
} from "@/lib/national-night-out/rate-limit";
import { resolvePublicStatusLookup } from "@/lib/national-night-out/public-status";
import {
  NationalNightOutValidationError,
  serializeNationalNightOutRequestDoc,
  validateNationalNightOutStatusLookup,
} from "@/lib/national-night-out/server";
import {
  NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
  STATUS_LOOKUP_NOT_FOUND_MESSAGE,
} from "@/lib/national-night-out/types";

function notFoundResponse(): Response {
  return NextResponse.json({ error: STATUS_LOOKUP_NOT_FOUND_MESSAGE }, { status: 404 });
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    let lookup;
    try {
      lookup = validateNationalNightOutStatusLookup(body);
    } catch (error) {
      if (error instanceof NationalNightOutValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    try {
      assertWithinStatusLookupRateLimit(getClientIpFromRequest(request));
    } catch {
      return NextResponse.json(
        { error: "Too many status checks. Please wait a while before trying again." },
        { status: 429 }
      );
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.nationalNightOutRequests)
      .where("requestId", "==", lookup.requestId)
      .limit(5)
      .get();

    for (const doc of snapshot.docs) {
      const record = serializeNationalNightOutRequestDoc(doc);
      const result = resolvePublicStatusLookup({
        record,
        requestId: lookup.requestId,
        email: lookup.email,
        eventDateLabel: NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
      });
      if (result.ok) {
        return NextResponse.json({ status: result.status });
      }
    }

    resolvePublicStatusLookup({
      record: null,
      requestId: lookup.requestId,
      email: lookup.email,
    });

    return notFoundResponse();
  } catch (error) {
    console.error("Failed to look up National Night Out status:", error);
    return NextResponse.json(
      { error: "Unable to check request status right now. Please try again later." },
      { status: 500 }
    );
  }
}

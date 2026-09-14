import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  assertWithinNationalNightOutStatusLookupRateLimit,
  getClientIpFromRequest,
} from "@/lib/national-night-out/rate-limit";
import {
  emailsMatchForStatusLookup,
  NationalNightOutValidationError,
  serializeNationalNightOutRequestDoc,
  toPublicNationalNightOutStatus,
  validateNationalNightOutStatusLookup,
} from "@/lib/national-night-out/server";

const GENERIC_NOT_FOUND =
  "We couldn’t find a request matching that Request ID and email address.";

function notFoundResponse(): Response {
  return NextResponse.json({ error: GENERIC_NOT_FOUND }, { status: 404 });
}

/**
 * Public Night Out status lookup.
 * Requires both Request ID and the requester email used at submission.
 * Never reveals whether a Request ID exists when the email does not match.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    let validated;
    try {
      validated = validateNationalNightOutStatusLookup(body);
    } catch (error) {
      if (error instanceof NationalNightOutValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const clientIp = getClientIpFromRequest(request);
    try {
      assertWithinNationalNightOutStatusLookupRateLimit(`${clientIp}:${validated.email}`);
    } catch {
      return NextResponse.json(
        {
          error:
            "Too many status checks were submitted recently. Please wait a while before trying again.",
        },
        { status: 429 }
      );
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.nationalNightOutRequests)
      .where("requestId", "==", validated.requestId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return notFoundResponse();
    }

    const record = serializeNationalNightOutRequestDoc(snapshot.docs[0]!);

    if (!emailsMatchForStatusLookup(record.email, validated.email)) {
      return notFoundResponse();
    }

    return NextResponse.json({
      status: toPublicNationalNightOutStatus(record),
    });
  } catch (error) {
    console.error("Failed National Night Out status lookup:", error);
    return NextResponse.json(
      { error: "Unable to look up that request right now. Please try again later." },
      { status: 500 }
    );
  }
}

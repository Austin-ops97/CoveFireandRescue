import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  ApplicationValidationError,
  validateApplicationPayload,
} from "@/lib/applications/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

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
      validated = validateApplicationPayload(body);
    } catch (error) {
      if (error instanceof ApplicationValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const docRef = adminDb.collection(COLLECTIONS.applications).doc();
    await docRef.set({
      ...validated,
      status: "new",
      submittedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, message: "Application received. Thank you." }, { status: 201 });
  } catch (error) {
    console.error("Failed to save application:", error);
    return NextResponse.json(
      { error: "Unable to submit application right now. Please try again later." },
      { status: 500 }
    );
  }
}

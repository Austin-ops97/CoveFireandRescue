import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { ContactValidationError, validateContactPayload } from "@/lib/contact/server";
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
      validated = validateContactPayload(body);
    } catch (error) {
      if (error instanceof ContactValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const docRef = adminDb.collection(COLLECTIONS.contactSubmissions).doc();
    await docRef.set({
      name: validated.name,
      email: validated.email,
      phone: validated.phone ?? "",
      message: validated.message,
      status: "new",
      submittedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { id: docRef.id, message: "Message received. We will respond as soon as possible." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save contact submission:", error);
    return NextResponse.json(
      { error: "Unable to send message right now. Please try again later." },
      { status: 500 }
    );
  }
}

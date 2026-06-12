import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  GalleryValidationError,
  gallerySortTime,
  serializeGalleryDoc,
  validateGalleryPayload,
} from "@/lib/gallery/server";
import type { GalleryFormState } from "@/lib/gallery/types";
import { requireManageContent, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function GET(request: Request) {
  try {
    await requireManageContent(request);

    const snapshot = await adminDb.collection(COLLECTIONS.gallery).limit(200).get();

    const items = snapshot.docs
      .map((doc) => serializeGalleryDoc(doc))
      .sort((a, b) => gallerySortTime(b) - gallerySortTime(a));

    return NextResponse.json({ items });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireManageContent(request);

    let body: GalleryFormState;
    try {
      body = (await request.json()) as GalleryFormState;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    let validated;
    try {
      validated = validateGalleryPayload(body);
    } catch (error) {
      if (error instanceof GalleryValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.gallery).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return NextResponse.json({ error: "Gallery item not found." }, { status: 400 });
      }

      const existingData = existing.data() ?? {};
      await docRef.set(
        {
          ...validated,
          uploadedAt: existingData.uploadedAt ?? FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json({ item: serializeGalleryDoc(await docRef.get()) });
    }

    const docRef = adminDb.collection(COLLECTIONS.gallery).doc();
    await docRef.set({
      ...validated,
      uploadedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ item: serializeGalleryDoc(await docRef.get()) }, { status: 201 });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

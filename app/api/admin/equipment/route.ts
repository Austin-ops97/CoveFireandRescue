import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireManageContent, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  equipmentSortKey,
  EquipmentValidationError,
  serializeEquipmentDoc,
  validateEquipmentPayload,
} from "@/lib/equipment/server";
import type { EquipmentFormState } from "@/lib/equipment/types";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    await requireManageContent(request);

    const snapshot = await adminDb.collection(COLLECTIONS.equipment).limit(300).get();

    const items = snapshot.docs
      .map((doc) => serializeEquipmentDoc(doc))
      .sort((a, b) => equipmentSortKey(a).localeCompare(equipmentSortKey(b)));

    return NextResponse.json({ items });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireManageContent(request);

    let body: EquipmentFormState;
    try {
      body = (await request.json()) as EquipmentFormState;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateEquipmentPayload(body);
    } catch (error) {
      if (error instanceof EquipmentValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.equipment).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return badRequest("Equipment item not found.");
      }

      await docRef.set(
        {
          ...validated,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json({ item: serializeEquipmentDoc(await docRef.get()) });
    }

    const docRef = adminDb.collection(COLLECTIONS.equipment).doc();
    await docRef.set({
      ...validated,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ item: serializeEquipmentDoc(await docRef.get()) }, { status: 201 });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

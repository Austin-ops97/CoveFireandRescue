import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireManageContent, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  serializeTrainingDoc,
  trainingSortTime,
  TrainingValidationError,
  validateTrainingPayload,
} from "@/lib/training/server";
import type { TrainingRecordFormState } from "@/lib/training/types";

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    await requireManageContent(request);

    const snapshot = await adminDb.collection(COLLECTIONS.trainingRecords).limit(300).get();

    const records = snapshot.docs
      .map((doc) => serializeTrainingDoc(doc))
      .sort((a, b) => trainingSortTime(b) - trainingSortTime(a));

    return NextResponse.json({ records });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireManageContent(request);

    let body: TrainingRecordFormState;
    try {
      body = (await request.json()) as TrainingRecordFormState;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateTrainingPayload(body);
    } catch (error) {
      if (error instanceof TrainingValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.trainingRecords).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return badRequest("Training record not found.");
      }

      await docRef.set(
        {
          ...validated,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json({ record: serializeTrainingDoc(await docRef.get()) });
    }

    const docRef = adminDb.collection(COLLECTIONS.trainingRecords).doc();
    await docRef.set({
      ...validated,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { record: serializeTrainingDoc(await docRef.get()) },
      { status: 201 }
    );
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

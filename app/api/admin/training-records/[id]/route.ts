import { NextResponse } from "next/server";
import { requireManageContent, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireManageContent(request);
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json({ error: "Record id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.trainingRecords).doc(id.trim());
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "Training record not found." }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

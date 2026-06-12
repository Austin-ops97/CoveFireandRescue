import { NextResponse } from "next/server";
import { requireServerRole, serverAuthErrorResponse } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireServerRole(request, ["admin"]);
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json({ error: "Item id is required." }, { status: 400 });
    }

    const docRef = adminDb.collection(COLLECTIONS.equipment).doc(id.trim());
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "Equipment item not found." }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import {
  requireDashboardAccess,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  serializeChecklistTemplateDoc,
  sortActiveReusableTemplates,
} from "@/lib/checklist/server";

export async function GET(request: Request) {
  try {
    await requireDashboardAccess(request);

    const snapshot = await adminDb
      .collection(COLLECTIONS.checklistTemplates)
      .where("active", "==", true)
      .where("reusable", "==", true)
      .limit(100)
      .get();

    const templates = sortActiveReusableTemplates(
      snapshot.docs.map((doc) => serializeChecklistTemplateDoc(doc))
    );

    return NextResponse.json({ templates });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

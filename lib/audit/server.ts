import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AuditLogEntry } from "@/lib/audit/types";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function writeAuditLog(
  entry: Omit<AuditLogEntry, "id" | "createdAt">
): Promise<boolean> {
  try {
    await adminDb.collection(COLLECTIONS.auditLogs).add({
      action: entry.action,
      actorUid: entry.actorUid,
      actorRole: entry.actorRole,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      message: entry.message ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return false;
  }
}

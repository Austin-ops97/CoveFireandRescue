import "server-only";

import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type {
  ChecklistNotificationRecord,
  ChecklistNotificationStatus,
  ChecklistSubmissionRecord,
} from "@/lib/checklist/types";
import { submissionHasAttentionItems } from "@/lib/checklist/types";
import type { ChecklistTemplateRecord } from "@/lib/checklist/types";

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readNotificationStatus(value: unknown): ChecklistNotificationStatus {
  if (value === "acknowledged" || value === "submission_deleted") {
    return value;
  }
  return "unread";
}

export function serializeChecklistNotificationDoc(
  doc: DocumentSnapshot
): ChecklistNotificationRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    submissionId: typeof data.submissionId === "string" ? data.submissionId : "",
    templateId: typeof data.templateId === "string" ? data.templateId : "",
    templateName: typeof data.templateName === "string" ? data.templateName : "",
    scope:
      data.scope === "fleet" ||
      data.scope === "station" ||
      data.scope === "equipment" ||
      data.scope === "general"
        ? data.scope
        : "general",
    relatedFleetUnitName:
      typeof data.relatedFleetUnitName === "string"
        ? data.relatedFleetUnitName
        : data.relatedFleetUnitName === null
          ? null
          : null,
    submittedBy: typeof data.submittedBy === "string" ? data.submittedBy : "",
    submittedByName:
      typeof data.submittedByName === "string"
        ? data.submittedByName
        : data.submittedByName === null
          ? null
          : null,
    hasAttention: data.hasAttention === true,
    status: readNotificationStatus(data.status),
    createdAt: serializeTimestamp(data.createdAt),
    acknowledgedAt: data.acknowledgedAt ? serializeTimestamp(data.acknowledgedAt) : null,
    acknowledgedBy:
      typeof data.acknowledgedBy === "string"
        ? data.acknowledgedBy
        : data.acknowledgedBy === null
          ? null
          : null,
    acknowledgedByName:
      typeof data.acknowledgedByName === "string"
        ? data.acknowledgedByName
        : data.acknowledgedByName === null
          ? null
          : null,
  };
}

function notificationTimestamp(value: unknown): number {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function sortNotificationsNewestFirst(
  notifications: ChecklistNotificationRecord[]
): ChecklistNotificationRecord[] {
  return [...notifications].sort(
    (a, b) => notificationTimestamp(b.createdAt) - notificationTimestamp(a.createdAt)
  );
}

export async function createSubmissionNotification(
  submission: ChecklistSubmissionRecord,
  template?: ChecklistTemplateRecord | null
): Promise<string> {
  const hasAttention = submissionHasAttentionItems(submission, template);

  const docRef = adminDb.collection(COLLECTIONS.checklistNotifications).doc();
  await docRef.set({
    submissionId: submission.id,
    templateId: submission.templateId,
    templateName: submission.templateName,
    scope: submission.scope,
    relatedFleetUnitName: submission.relatedFleetUnitName ?? null,
    submittedBy: submission.submittedBy,
    submittedByName: submission.submittedByName ?? null,
    hasAttention,
    status: "unread",
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

export async function cleanupNotificationsForDeletedSubmission(
  submissionId: string
): Promise<void> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.checklistNotifications)
    .where("submissionId", "==", submissionId)
    .get();

  if (snapshot.empty) return;

  const batch = adminDb.batch();
  for (const doc of snapshot.docs) {
    const status = readNotificationStatus(doc.data().status);
    if (status === "unread") {
      batch.delete(doc.ref);
    } else if (status === "acknowledged") {
      batch.update(doc.ref, {
        status: "submission_deleted",
      });
    }
  }

  await batch.commit();
}

export async function countUnreadNotifications(): Promise<number> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.checklistNotifications)
    .where("status", "==", "unread")
    .limit(500)
    .get();

  return snapshot.size;
}

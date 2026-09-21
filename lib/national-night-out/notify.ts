import "server-only";

import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { siteConfig } from "@/lib/config/site";
import { sendTransactionalEmail } from "@/lib/email/send";
import { buildNightOutStatusEmail, shouldNotifyStatusChange } from "./notifications";
import {
  NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
  type NationalNightOutNotificationResult,
  type NationalNightOutRequestRecord,
  type NationalNightOutStatus,
} from "./types";

function statusCheckUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!base) return null;
  return `${base}/national-night-out/status`;
}

export async function deliverNationalNightOutStatusEmail(
  record: Pick<
    NationalNightOutRequestRecord,
    | "requestId"
    | "requesterName"
    | "email"
    | "neighborhood"
    | "preferredTime"
    | "status"
    | "statusNote"
  >
): Promise<NationalNightOutNotificationResult> {
  const message = buildNightOutStatusEmail({
    requestId: record.requestId,
    requesterName: record.requesterName,
    neighborhood: record.neighborhood,
    preferredTime: record.preferredTime,
    status: record.status,
    statusNote: record.statusNote,
    eventDateLabel: NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
    departmentName: siteConfig.name,
    publicPhone: siteConfig.contact.publicPhone,
    publicEmail: siteConfig.contact.publicEmail,
    statusCheckUrl: statusCheckUrl(),
  });

  const result = await sendTransactionalEmail({
    to: record.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  if (result.outcome === "sent" || result.outcome === "logged") {
    return { outcome: result.outcome };
  }

  return { outcome: result.outcome, message: result.message };
}

export async function notifyNationalNightOutStatus(input: {
  docRef: DocumentReference;
  previousStatus: NationalNightOutStatus | null;
  nextStatus: NationalNightOutStatus;
  lastNotifiedStatus: NationalNightOutStatus | null;
  previousNote: string;
  nextNote: string;
  record: Pick<
    NationalNightOutRequestRecord,
    "requestId" | "requesterName" | "email" | "neighborhood" | "preferredTime"
  >;
}): Promise<NationalNightOutNotificationResult> {
  const decision = shouldNotifyStatusChange({
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    lastNotifiedStatus: input.lastNotifiedStatus,
    previousNote: input.previousNote,
    nextNote: input.nextNote,
  });

  if (!decision.notify) {
    return { outcome: "skipped", reason: decision.reason };
  }

  const notification = await deliverNationalNightOutStatusEmail({
    ...input.record,
    status: input.nextStatus,
    statusNote: input.nextNote,
  });

  if (notification.outcome === "sent" || notification.outcome === "logged") {
    await input.docRef.set(
      {
        lastNotifiedStatus: input.nextStatus,
        lastNotifiedAt: FieldValue.serverTimestamp(),
        lastNotificationError: null,
      },
      { merge: true }
    );
    return notification;
  }

  await input.docRef.set(
    {
      lastNotificationError: notification.message ?? "The status email could not be sent.",
    },
    { merge: true }
  );

  return notification;
}

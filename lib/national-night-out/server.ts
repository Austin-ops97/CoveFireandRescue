import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import {
  NNO_STATUSES,
  type NationalNightOutRequestRecord,
  type NationalNightOutSettings,
  type NationalNightOutStatus,
} from "./types";

export {
  NationalNightOutValidationError,
  buildNationalNightOutRequestId,
  validateNationalNightOutPayload,
  validateNationalNightOutSettingsUpdate,
  validateNationalNightOutStatusLookup,
  validateNationalNightOutStatusUpdate,
} from "./validation";

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readStatus(value: unknown): NationalNightOutStatus {
  if (typeof value === "string" && NNO_STATUSES.includes(value as NationalNightOutStatus)) {
    return value as NationalNightOutStatus;
  }
  return "pending";
}

export function serializeNationalNightOutRequestDoc(
  doc: DocumentSnapshot
): NationalNightOutRequestRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    requestId:
      typeof data.requestId === "string" && data.requestId.trim()
        ? data.requestId
        : `NNO-${doc.id.slice(0, 6).toUpperCase()}`,
    requesterName: typeof data.requesterName === "string" ? data.requesterName : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    email: typeof data.email === "string" ? data.email : "",
    neighborhood: typeof data.neighborhood === "string" ? data.neighborhood : "",
    address: typeof data.address === "string" ? data.address : "",
    city: typeof data.city === "string" ? data.city : "",
    zipCode: typeof data.zipCode === "string" ? data.zipCode : "",
    preferredTime: typeof data.preferredTime === "string" ? data.preferredTime : "",
    estimatedAttendance:
      typeof data.estimatedAttendance === "string"
        ? data.estimatedAttendance
        : typeof data.estimatedAttendance === "number"
          ? String(data.estimatedAttendance)
          : "",
    accessInstructions:
      typeof data.accessInstructions === "string" ? data.accessInstructions : "",
    comments: typeof data.comments === "string" ? data.comments : "",
    disclaimerAccepted: data.disclaimerAccepted === true,
    status: readStatus(data.status),
    statusNote: typeof data.statusNote === "string" ? data.statusNote : "",
    lastNotifiedStatus: readOptionalStatus(data.lastNotifiedStatus),
    lastNotifiedAt: data.lastNotifiedAt ? serializeTimestamp(data.lastNotifiedAt) : null,
    lastNotificationError:
      typeof data.lastNotificationError === "string" ? data.lastNotificationError : null,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function readOptionalStatus(value: unknown): NationalNightOutStatus | null {
  if (typeof value === "string" && NNO_STATUSES.includes(value as NationalNightOutStatus)) {
    return value as NationalNightOutStatus;
  }
  return null;
}

export function serializeNationalNightOutSettings(
  data: Record<string, unknown> | undefined | null
): NationalNightOutSettings {
  return {
    enabled: data?.enabled === true,
    updatedAt: serializeTimestamp(data?.updatedAt),
    updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
  };
}

export function nationalNightOutSortTime(record: NationalNightOutRequestRecord): number {
  if (typeof record.createdAt === "string") {
    const time = new Date(record.createdAt).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  return 0;
}

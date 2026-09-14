import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type {
  NationalNightOutPublicStatus,
  NationalNightOutRequestRecord,
  NationalNightOutSettings,
  NationalNightOutStatus,
} from "./types";
import { normalizeNationalNightOutStatus } from "./validation";

export {
  NationalNightOutValidationError,
  buildNationalNightOutRequestId,
  normalizeNationalNightOutStatus,
  validateNationalNightOutPayload,
  validateNationalNightOutSettingsUpdate,
  validateNationalNightOutStatusLookup,
  validateNationalNightOutStatusUpdate,
} from "./validation";

export {
  emailsMatchForStatusLookup,
  shouldSendNationalNightOutStatusNotification,
  toPublicNationalNightOutStatus,
} from "./notifications";

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readOptionalNotifiedStatus(value: unknown): NationalNightOutStatus | null {
  if (value === null || value === undefined || value === "") return null;
  return normalizeNationalNightOutStatus(value);
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
    status: normalizeNationalNightOutStatus(data.status),
    adminNotes: typeof data.adminNotes === "string" ? data.adminNotes : "",
    lastNotifiedStatus: readOptionalNotifiedStatus(data.lastNotifiedStatus),
    lastNotifiedAt: serializeTimestamp(data.lastNotifiedAt),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
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

// Re-export types used only for documentation clarity in this module.
export type { NationalNightOutPublicStatus };

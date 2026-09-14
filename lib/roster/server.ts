import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import {
  ROSTER_ACTIVITY_STATUSES,
  type RosterActivityStatus,
  type RosterMemberRecord,
} from "./types";

export {
  RosterValidationError,
  normalizePhoneNumber,
  validateRosterMemberPayload,
} from "./validation";

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readActivityStatus(value: unknown): RosterActivityStatus {
  if (
    typeof value === "string" &&
    ROSTER_ACTIVITY_STATUSES.includes(value as RosterActivityStatus)
  ) {
    return value as RosterActivityStatus;
  }
  return "active";
}

export function serializeRosterMemberDoc(doc: DocumentSnapshot): RosterMemberRecord {
  const data = doc.data() ?? {};
  const unitRaw = data.unitNumber;
  const unitNumber =
    typeof unitRaw === "number"
      ? unitRaw
      : typeof unitRaw === "string"
        ? Number.parseInt(unitRaw, 10)
        : 0;

  return {
    id: doc.id,
    unitNumber: Number.isFinite(unitNumber) ? unitNumber : 0,
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName: typeof data.lastName === "string" ? data.lastName : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    email: typeof data.email === "string" ? data.email : "",
    rank: typeof data.rank === "string" ? data.rank : "",
    activityStatus: readActivityStatus(data.activityStatus),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function rosterSortByUnitNumber(a: RosterMemberRecord, b: RosterMemberRecord): number {
  if (a.unitNumber !== b.unitNumber) return a.unitNumber - b.unitNumber;
  return rosterSortByName(a, b);
}

export function rosterSortByName(a: RosterMemberRecord, b: RosterMemberRecord): number {
  const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
  if (last !== 0) return last;
  return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
}

import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { RosterActivityStatus, RosterMemberRecord } from "./types";
import { isRosterActivityStatus } from "./validation";

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readActivityStatus(value: unknown): RosterActivityStatus {
  if (isRosterActivityStatus(value)) return value;
  return "non_active";
}

export function serializeRosterMemberDoc(doc: DocumentSnapshot): RosterMemberRecord {
  const data = doc.data() ?? {};
  const unitFromField =
    typeof data.unitNumber === "number"
      ? data.unitNumber
      : Number.parseInt(typeof data.unitNumber === "string" ? data.unitNumber : "", 10);
  const unitFromId = Number.parseInt(doc.id, 10);
  const unitNumber = Number.isInteger(unitFromField) ? unitFromField : unitFromId;

  return {
    id: doc.id,
    unitNumber: Number.isInteger(unitNumber) ? unitNumber : 0,
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

export function rosterDocId(unitNumber: number): string {
  return String(unitNumber);
}

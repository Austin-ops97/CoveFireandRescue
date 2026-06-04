import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type {
  ContactFormPayload,
  ContactSubmissionRecord,
  ContactSubmissionStatus,
} from "./types";

const VALID_STATUSES: ContactSubmissionStatus[] = ["new", "reviewed", "archived"];

export class ContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readStatus(value: unknown): ContactSubmissionStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as ContactSubmissionStatus)) {
    return value as ContactSubmissionStatus;
  }
  return "new";
}

export function serializeContactDoc(doc: DocumentSnapshot): ContactSubmissionRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    message: typeof data.message === "string" ? data.message : "",
    submittedAt: serializeTimestamp(data.submittedAt),
    status: readStatus(data.status),
  };
}

export function validateContactPayload(input: unknown): ContactFormPayload {
  if (!input || typeof input !== "object") {
    throw new ContactValidationError("Invalid contact payload.");
  }

  const payload = input as Record<string, unknown>;

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name || name.length > 120) {
    throw new ContactValidationError("Name is required.");
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ContactValidationError("A valid email address is required.");
  }

  const phone = typeof payload.phone === "string" ? payload.phone.trim().slice(0, 30) : "";

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message || message.length > 5000) {
    throw new ContactValidationError("Message is required (5000 characters max).");
  }

  return { name, email, phone: phone || undefined, message };
}

export function contactSortTime(record: ContactSubmissionRecord): number {
  if (typeof record.submittedAt === "string") {
    const time = new Date(record.submittedAt).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  return 0;
}

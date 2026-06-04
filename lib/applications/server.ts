import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { ApplicationFormPayload, ApplicationRecord, ApplicationStatus } from "./types";

const VALID_STATUSES: ApplicationStatus[] = ["new", "reviewed", "archived"];

export class ApplicationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readStatus(value: unknown): ApplicationStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as ApplicationStatus)) {
    return value as ApplicationStatus;
  }
  return "new";
}

export function serializeApplicationDoc(doc: DocumentSnapshot): ApplicationRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    email: typeof data.email === "string" ? data.email : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    addressOrCity: typeof data.addressOrCity === "string" ? data.addressOrCity : "",
    ageConfirmed: data.ageConfirmed === true,
    priorExperience: typeof data.priorExperience === "string" ? data.priorExperience : "",
    availability: typeof data.availability === "string" ? data.availability : "",
    reasonForJoining: typeof data.reasonForJoining === "string" ? data.reasonForJoining : "",
    consent: data.consent === true,
    submittedAt: serializeTimestamp(data.submittedAt),
    status: readStatus(data.status),
  };
}

export function validateApplicationPayload(input: unknown): ApplicationFormPayload {
  if (!input || typeof input !== "object") {
    throw new ApplicationValidationError("Invalid application payload.");
  }

  const payload = input as Record<string, unknown>;

  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  if (!fullName || fullName.length > 120) {
    throw new ApplicationValidationError("Full name is required (120 characters max).");
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApplicationValidationError("A valid email address is required.");
  }

  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  if (!phone || phone.length > 30) {
    throw new ApplicationValidationError("Phone number is required.");
  }

  const addressOrCity =
    typeof payload.addressOrCity === "string" ? payload.addressOrCity.trim() : "";
  if (!addressOrCity || addressOrCity.length > 200) {
    throw new ApplicationValidationError("Address or city is required.");
  }

  if (payload.ageConfirmed !== true) {
    throw new ApplicationValidationError("You must confirm you meet minimum age requirements.");
  }

  const priorExperience =
    typeof payload.priorExperience === "string" ? payload.priorExperience.trim() : "";
  const availability = typeof payload.availability === "string" ? payload.availability.trim() : "";
  const reasonForJoining =
    typeof payload.reasonForJoining === "string" ? payload.reasonForJoining.trim() : "";

  if (!reasonForJoining) {
    throw new ApplicationValidationError("Please tell us why you want to join.");
  }

  if (payload.consent !== true) {
    throw new ApplicationValidationError("You must acknowledge the volunteer application terms.");
  }

  return {
    fullName,
    email,
    phone,
    addressOrCity,
    ageConfirmed: true,
    priorExperience: priorExperience.slice(0, 2000),
    availability: availability.slice(0, 2000),
    reasonForJoining: reasonForJoining.slice(0, 3000),
    consent: true,
  };
}

export function applicationSortTime(record: ApplicationRecord): number {
  if (typeof record.submittedAt === "string") {
    const time = new Date(record.submittedAt).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  return 0;
}

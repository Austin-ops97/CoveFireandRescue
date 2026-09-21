import {
  NNO_STATUSES,
  type NationalNightOutFormPayload,
  type NationalNightOutStatus,
} from "./types";

export class NationalNightOutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NationalNightOutValidationError";
  }
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateNationalNightOutPayload(input: unknown): NationalNightOutFormPayload {
  if (!input || typeof input !== "object") {
    throw new NationalNightOutValidationError("Invalid request payload.");
  }

  const payload = input as Record<string, unknown>;

  // Honeypot — bots often fill hidden fields. Treat as spam without revealing why.
  const website = asTrimmedString(payload.website);
  if (website) {
    throw new NationalNightOutValidationError("Unable to submit this request.");
  }

  const requesterName = asTrimmedString(payload.requesterName);
  if (!requesterName || requesterName.length > 120) {
    throw new NationalNightOutValidationError("Full name is required (120 characters max).");
  }

  const phone = asTrimmedString(payload.phone);
  if (!phone || phone.length > 30) {
    throw new NationalNightOutValidationError("Phone number is required.");
  }

  const email = asTrimmedString(payload.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    throw new NationalNightOutValidationError("A valid email address is required.");
  }

  const neighborhood = asTrimmedString(payload.neighborhood);
  if (!neighborhood || neighborhood.length > 200) {
    throw new NationalNightOutValidationError("Neighborhood / subdivision name is required.");
  }

  const address = asTrimmedString(payload.address);
  if (!address || address.length > 300) {
    throw new NationalNightOutValidationError("Event address is required.");
  }

  const city = asTrimmedString(payload.city);
  if (!city || city.length > 120) {
    throw new NationalNightOutValidationError("City is required.");
  }

  const zipCode = asTrimmedString(payload.zipCode);
  if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
    throw new NationalNightOutValidationError("A valid ZIP code is required.");
  }

  const preferredTime = asTrimmedString(payload.preferredTime);
  if (!preferredTime || preferredTime.length > 200) {
    throw new NationalNightOutValidationError("Preferred visit time is required.");
  }

  const estimatedAttendance = asTrimmedString(payload.estimatedAttendance);
  if (!estimatedAttendance || estimatedAttendance.length > 50) {
    throw new NationalNightOutValidationError("Estimated number of attendees is required.");
  }

  const accessInstructions = asTrimmedString(payload.accessInstructions).slice(0, 2000);
  const comments = asTrimmedString(payload.comments).slice(0, 3000);

  if (payload.disclaimerAccepted !== true) {
    throw new NationalNightOutValidationError(
      "You must acknowledge that submitting this request does not guarantee a department visit."
    );
  }

  return {
    requesterName,
    phone,
    email: email.toLowerCase(),
    neighborhood,
    address,
    city,
    zipCode,
    preferredTime,
    estimatedAttendance,
    accessInstructions,
    comments,
    disclaimerAccepted: true,
  };
}

export function validateNationalNightOutStatusUpdate(input: unknown): {
  status: NationalNightOutStatus;
  /** Null means the caller did not include a note, so the stored note should stay. */
  statusNote: string | null;
} {
  if (!input || typeof input !== "object") {
    throw new NationalNightOutValidationError("Invalid status update payload.");
  }

  const payload = input as Record<string, unknown>;
  const status = payload.status;

  if (typeof status !== "string" || !NNO_STATUSES.includes(status as NationalNightOutStatus)) {
    throw new NationalNightOutValidationError(
      "Status must be Submitted, Under Review, Approved, or Denied."
    );
  }

  if (payload.statusNote === undefined || payload.statusNote === null) {
    return { status: status as NationalNightOutStatus, statusNote: null };
  }

  if (typeof payload.statusNote !== "string") {
    throw new NationalNightOutValidationError("Status note must be text.");
  }

  const statusNote = payload.statusNote.replace(/\0/g, "").trim().slice(0, 2000);
  return { status: status as NationalNightOutStatus, statusNote };
}

export function normalizeNightOutRequestId(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Missing fields are a form error. A present but unmatched pair always uses
 * the same not-found response from the lookup route, including invalid IDs.
 */
export function validateNationalNightOutStatusLookup(input: unknown): {
  requestId: string;
  email: string;
} {
  if (!input || typeof input !== "object") {
    throw new NationalNightOutValidationError("Request ID and email address are required.");
  }

  const payload = input as Record<string, unknown>;
  const requestId = normalizeNightOutRequestId(asTrimmedString(payload.requestId));
  const email = asTrimmedString(payload.email).toLowerCase();

  if (!requestId || !email) {
    throw new NationalNightOutValidationError("Request ID and email address are required.");
  }

  if (requestId.length > 40 || email.length > 200) {
    throw new NationalNightOutValidationError("Request ID and email address are required.");
  }

  return { requestId, email };
}

export function validateNationalNightOutSettingsUpdate(input: unknown): { enabled: boolean } {
  if (!input || typeof input !== "object") {
    throw new NationalNightOutValidationError("Invalid settings payload.");
  }

  const payload = input as Record<string, unknown>;
  if (typeof payload.enabled !== "boolean") {
    throw new NationalNightOutValidationError("Enabled must be true or false.");
  }

  return { enabled: payload.enabled };
}

export function buildNationalNightOutRequestId(docId: string): string {
  return `NNO-${docId.slice(0, 6).toUpperCase()}`;
}

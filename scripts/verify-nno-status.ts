/**
 * National Night Out status lookup + notification dedupe verification.
 * Does not require Firebase credentials or real email sending.
 */
import {
  assertWithinNationalNightOutStatusLookupRateLimit,
} from "../lib/national-night-out/rate-limit";
import {
  buildNationalNightOutStatusEmail,
  emailsMatchForStatusLookup,
  shouldSendNationalNightOutStatusNotification,
  toPublicNationalNightOutStatus,
} from "../lib/national-night-out/notifications";
import {
  buildNationalNightOutRequestId,
  normalizeNationalNightOutStatus,
  validateNationalNightOutPayload,
  validateNationalNightOutStatusLookup,
  validateNationalNightOutStatusUpdate,
  NationalNightOutValidationError,
} from "../lib/national-night-out/validation";
import type { NationalNightOutRequestRecord } from "../lib/national-night-out/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function expectThrow(fn: () => void, includes: string) {
  try {
    fn();
    throw new Error(`Expected throw containing: ${includes}`);
  } catch (error) {
    if (!(error instanceof NationalNightOutValidationError)) throw error;
    assert(error.message.includes(includes), `Expected "${includes}" in "${error.message}"`);
  }
}

assert(normalizeNationalNightOutStatus("pending") === "submitted", "legacy pending maps");
assert(normalizeNationalNightOutStatus("under_review") === "under_review", "under review ok");

const payload = {
  requesterName: "Alex Neighbor",
  phone: "2815550199",
  email: "alex@example.com",
  neighborhood: "Bayou Bend",
  address: "500 Oak Lane",
  city: "Cove",
  zipCode: "77523",
  preferredTime: "6:30 PM",
  estimatedAttendance: "25",
  accessInstructions: "Call at gate",
  comments: "Please bring stickers if possible",
  disclaimerAccepted: true,
};

const validated = validateNationalNightOutPayload(payload);
const id = "abcdef123456";
const requestId = buildNationalNightOutRequestId(id);

const record: NationalNightOutRequestRecord = {
  id,
  requestId,
  requesterName: validated.requesterName,
  phone: validated.phone,
  email: validated.email,
  neighborhood: validated.neighborhood,
  address: validated.address,
  city: validated.city,
  zipCode: validated.zipCode,
  preferredTime: validated.preferredTime,
  estimatedAttendance: validated.estimatedAttendance,
  accessInstructions: validated.accessInstructions ?? "",
  comments: validated.comments ?? "",
  disclaimerAccepted: true,
  status: "submitted",
  adminNotes: "",
  lastNotifiedStatus: "submitted",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Correct Request ID + email → public status only
const lookup = validateNationalNightOutStatusLookup({
  requestId,
  email: "Alex@Example.com",
});
assert(lookup.email === "alex@example.com", "lookup email lowercased");
assert(emailsMatchForStatusLookup(record.email, lookup.email), "matching email accepted");

const publicStatus = toPublicNationalNightOutStatus(record);
assert(publicStatus.requestId === requestId, "public request id");
assert(publicStatus.status === "submitted", "public status");
assert(!("adminNotes" in publicStatus), "no admin notes in public payload");
assert(!("comments" in publicStatus), "no comments in public payload");
assert(!("id" in publicStatus), "no internal id in public payload");

// Incorrect email — do not reveal whether the Request ID exists
assert(
  emailsMatchForStatusLookup(record.email, "wrong@example.com") === false,
  "wrong email rejected"
);

// Invalid Request ID format
expectThrow(
  () => validateNationalNightOutStatusLookup({ requestId: "REQ-1", email: "alex@example.com" }),
  "Request ID"
);

// Status update validation
assert(
  validateNationalNightOutStatusUpdate({ status: "approved" }).status === "approved",
  "approve"
);
assert(
  validateNationalNightOutStatusUpdate({ status: "under_review" }).status === "under_review",
  "under review"
);
assert(
  validateNationalNightOutStatusUpdate({ status: "pending" }).status === "submitted",
  "legacy pending update"
);
assert(
  validateNationalNightOutStatusUpdate({
    status: "denied",
    adminNotes: "Apparatus unavailable",
  }).adminNotes === "Apparatus unavailable",
  "denial notes"
);

assert(
  shouldSendNationalNightOutStatusNotification({
    previousStatus: "submitted",
    nextStatus: "submitted",
    lastNotifiedStatus: "submitted",
  }) === false,
  "no duplicate submitted notify"
);
assert(
  shouldSendNationalNightOutStatusNotification({
    previousStatus: "submitted",
    nextStatus: "under_review",
    lastNotifiedStatus: "submitted",
  }) === true,
  "notify under review"
);
assert(
  shouldSendNationalNightOutStatusNotification({
    previousStatus: "under_review",
    nextStatus: "under_review",
    lastNotifiedStatus: "under_review",
  }) === false,
  "no duplicate under review"
);
assert(
  shouldSendNationalNightOutStatusNotification({
    previousStatus: "under_review",
    nextStatus: "approved",
    lastNotifiedStatus: "under_review",
  }) === true,
  "notify approved"
);

const approvedEmail = buildNationalNightOutStatusEmail({
  request: { ...record, status: "approved", adminNotes: "" },
  status: "approved",
});
assert(approvedEmail.subject.includes("approved"), "approved subject");
assert(approvedEmail.text.includes("Cove Fire & Rescue"), "brand in text");
assert(approvedEmail.text.includes(requestId), "request id in text");
assert(approvedEmail.text.includes("Approved"), "approved label");

const deniedEmail = buildNationalNightOutStatusEmail({
  request: {
    ...record,
    status: "denied",
    adminNotes: "Staffing limited that evening",
  },
  status: "denied",
});
assert(deniedEmail.text.includes("Staffing limited that evening"), "denial reason included");

// Rate limit smoke
assertWithinNationalNightOutStatusLookupRateLimit("test-ip:alex@example.com");

console.log("National Night Out status/notification checks passed.");

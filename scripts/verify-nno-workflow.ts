/**
 * End-to-end business-logic simulation for National Night Out workflow.
 * Does not require Firebase credentials.
 */
import {
  assertWithinNationalNightOutRateLimit,
} from "../lib/national-night-out/rate-limit";
import {
  buildNationalNightOutRequestId,
  validateNationalNightOutPayload,
  validateNationalNightOutSettingsUpdate,
  validateNationalNightOutStatusUpdate,
} from "../lib/national-night-out/validation";
import { shouldNotifyStatusChange } from "../lib/national-night-out/notifications";
import { resolvePublicStatusLookup } from "../lib/national-night-out/public-status";
import { STATUS_LOOKUP_NOT_FOUND_MESSAGE } from "../lib/national-night-out/types";
import type {
  NationalNightOutRequestRecord,
  NationalNightOutStatus,
} from "../lib/national-night-out/types";

type SettingsDoc = { enabled: boolean };

const db = {
  settings: { enabled: false } as SettingsDoc,
  requests: new Map<string, NationalNightOutRequestRecord>(),
};

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function publicCanSubmit(): boolean {
  return db.settings.enabled === true;
}

function submitRequest(payload: unknown) {
  if (!publicCanSubmit()) {
    throw new Error("BLOCKED_WHEN_DISABLED");
  }
  const validated = validateNationalNightOutPayload(payload);
  const id = `doc${db.requests.size + 1}abcdef`;
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
    status: "pending",
    statusNote: "",
    lastNotifiedStatus: null,
    lastNotificationError: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.requests.set(id, record);
  return record;
}

function setStatus(id: string, status: NationalNightOutStatus) {
  const existing = db.requests.get(id);
  if (!existing) throw new Error("NOT_FOUND");
  const next = {
    ...existing,
    status: validateNationalNightOutStatusUpdate({ status }).status,
    updatedAt: new Date().toISOString(),
  };
  db.requests.set(id, next);
  return next;
}

function deleteRequest(id: string) {
  if (!db.requests.has(id)) throw new Error("NOT_FOUND");
  db.requests.delete(id);
}

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

// Disabled by default
assert(db.settings.enabled === false, "default disabled");
try {
  submitRequest(payload);
  throw new Error("Expected submission blocked");
} catch (error) {
  assert(error instanceof Error && error.message === "BLOCKED_WHEN_DISABLED", "blocked when disabled");
}

// Admin enables
db.settings = validateNationalNightOutSettingsUpdate({ enabled: true });
assert(db.settings.enabled === true, "enabled");

// Banner would show when enabled
const bannerVisible = db.settings.enabled;
assert(bannerVisible === true, "banner visible when enabled");

// Public submits
const created = submitRequest(payload);
assert(created.status === "pending", "initial pending");
assert(created.disclaimerAccepted === true, "disclaimer stored");
assert(created.accessInstructions === "Call at gate", "access preserved");
assert(created.requestId.startsWith("NNO-"), "request id generated");

// Admin sees pending list
const pending = [...db.requests.values()].filter((item) => item.status === "pending");
assert(pending.length === 1, "admin sees pending");

// Admin opens and approves
const approved = setStatus(created.id, "approved");
assert(approved.status === "approved", "approved saved");

// Admin can later deny (accidental correction)
const denied = setStatus(created.id, "denied");
assert(denied.status === "denied", "denied saved");

const reviewed = setStatus(created.id, "under_review");
assert(reviewed.status === "under_review", "under review saved");

// Disable feature — previous requests remain
db.settings = validateNationalNightOutSettingsUpdate({ enabled: false });
assert(db.settings.enabled === false, "disabled");
assert(db.requests.has(created.id), "request retained after disable");
try {
  submitRequest(payload);
  throw new Error("Expected blocked after disable");
} catch (error) {
  assert(error instanceof Error && error.message === "BLOCKED_WHEN_DISABLED", "new submissions blocked");
}

// Delete
deleteRequest(created.id);
assert(!db.requests.has(created.id), "deleted");

// Rate limit
assertWithinNationalNightOutRateLimit("test-ip:alex@example.com");
assertWithinNationalNightOutRateLimit("test-ip:alex@example.com");
assertWithinNationalNightOutRateLimit("test-ip:alex@example.com");
assertWithinNationalNightOutRateLimit("test-ip:alex@example.com");
assertWithinNationalNightOutRateLimit("test-ip:alex@example.com");
try {
  assertWithinNationalNightOutRateLimit("test-ip:alex@example.com");
  throw new Error("Expected rate limit");
} catch (error) {
  assert(error instanceof Error && error.message === "RATE_LIMITED", "rate limited");
}

assert(
  shouldNotifyStatusChange({
    previousStatus: "pending",
    nextStatus: "under_review",
    lastNotifiedStatus: "pending",
  }).notify,
  "status change notifies"
);
assert(
  shouldNotifyStatusChange({
    previousStatus: "under_review",
    nextStatus: "under_review",
    lastNotifiedStatus: "under_review",
  }).notify === false,
  "duplicate status does not notify"
);

const found = resolvePublicStatusLookup({
  record: created,
  requestId: created.requestId,
  email: created.email,
});
assert(found.ok === true, "lookup matches id and email");
const hidden = resolvePublicStatusLookup({
  record: created,
  requestId: created.requestId,
  email: "other@example.com",
});
assert(hidden.ok === false && hidden.message === STATUS_LOOKUP_NOT_FOUND_MESSAGE, "wrong email hidden");

console.log("National Night Out workflow simulation passed.");

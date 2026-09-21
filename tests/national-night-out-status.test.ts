import assert from "node:assert/strict";
import test from "node:test";
import { buildNightOutStatusEmail, shouldNotifyStatusChange } from "../lib/national-night-out/notifications";
import { resolvePublicStatusLookup } from "../lib/national-night-out/public-status";
import {
  NNO_STATUS_LABELS,
  STATUS_LOOKUP_NOT_FOUND_MESSAGE,
  type NationalNightOutStatus,
} from "../lib/national-night-out/types";
import {
  NationalNightOutValidationError,
  validateNationalNightOutPayload,
  validateNationalNightOutStatusUpdate,
} from "../lib/national-night-out/validation";

const SECRET_NOTE = "Internal denial detail: gate code 9999";
const SECRET_PHONE = "(281) 555-0199";

const record = {
  id: "firestore-doc-id",
  requestId: "NNO-AB12CD",
  email: "neighbor@example.com",
  status: "approved" as NationalNightOutStatus,
  createdAt: "2026-09-01T18:00:00.000Z",
  updatedAt: "2026-09-02T18:00:00.000Z",
  statusNote: SECRET_NOTE,
  phone: SECRET_PHONE,
  address: "5735 S FM 565",
  comments: "Officer-only comment",
};

test("matching request id and email returns only the public status fields", () => {
  const result = resolvePublicStatusLookup({
    record,
    requestId: "nno-ab12cd",
    email: "Neighbor@Example.com",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.status.requestId, "NNO-AB12CD");
  assert.equal(result.status.status, "approved");
  assert.equal(result.status.statusLabel, "Approved");
  assert.equal(result.status.eventType, "National Night Out visit");
  assert.equal(result.status.requestedEventDate, "October 6");
  assert.deepEqual(Object.keys(result.status).sort(), [
    "eventType",
    "lastUpdated",
    "requestId",
    "requestedEventDate",
    "status",
    "statusLabel",
    "submittedAt",
  ]);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(SECRET_NOTE), false);
  assert.equal(serialized.includes(SECRET_PHONE), false);
  assert.equal(serialized.includes("firestore-doc-id"), false);
  assert.equal(serialized.includes("5735"), false);
});

test("the wrong email does not return request information", () => {
  const result = resolvePublicStatusLookup({
    record,
    requestId: record.requestId,
    email: "someoneelse@example.com",
  });

  assert.deepEqual(result, { ok: false, message: STATUS_LOOKUP_NOT_FOUND_MESSAGE });
  assert.equal(JSON.stringify(result).includes(SECRET_NOTE), false);
  assert.equal(JSON.stringify(result).includes(record.requestId), false);
});

test("an invalid request id does not reveal whether another request exists", () => {
  const missing = resolvePublicStatusLookup({
    record: null,
    requestId: "NNO-NOTREAL",
    email: "neighbor@example.com",
  });
  const wrongId = resolvePublicStatusLookup({
    record,
    requestId: "NOPE",
    email: record.email,
  });

  assert.deepEqual(missing, wrongId);
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.message, STATUS_LOOKUP_NOT_FOUND_MESSAGE);
  }
  assert.equal(JSON.stringify(wrongId).includes(SECRET_PHONE), false);
  assert.equal(JSON.stringify(wrongId).includes("approved"), false);
});

test("status changes choose a notification and duplicate updates do not", () => {
  assert.deepEqual(
    shouldNotifyStatusChange({
      previousStatus: null,
      nextStatus: "pending",
      lastNotifiedStatus: null,
    }),
    { notify: true, reason: "status_changed" }
  );

  assert.equal(
    shouldNotifyStatusChange({
      previousStatus: "pending",
      nextStatus: "under_review",
      lastNotifiedStatus: "pending",
    }).notify,
    true
  );

  assert.equal(
    shouldNotifyStatusChange({
      previousStatus: "under_review",
      nextStatus: "approved",
      lastNotifiedStatus: "under_review",
    }).reason,
    "status_changed"
  );

  const denied = buildNightOutStatusEmail({
    requestId: "NNO-AB12CD",
    requesterName: "Neighborhood Lead",
    neighborhood: "Cove Estates",
    preferredTime: "6:00 PM",
    status: "denied",
    statusNote: "Crew is committed to another event.",
    eventDateLabel: "October 6",
    departmentName: "Cove Fire & Rescue",
    publicPhone: "(281) 573-9193",
    publicEmail: "cvfd@chamberstx.gov",
    statusCheckUrl: "https://covefireandrescue.org/national-night-out/status",
  });
  assert.match(denied.text, /Request status: Denied/);
  assert.match(denied.text, /Reason: Crew is committed to another event/);
  assert.match(denied.subject, /Denied/);
  assert.equal(denied.subject.includes("\n"), false);

  const approved = buildNightOutStatusEmail({
    requestId: "NNO-AB12CD\r\nBcc: evil@example.com",
    requesterName: "<script>alert(1)</script>",
    neighborhood: "Cove Estates",
    preferredTime: "6:00 PM",
    status: "approved",
    statusNote: "",
    eventDateLabel: "October 6",
    departmentName: "Cove Fire & Rescue",
    publicPhone: "(281) 573-9193",
    publicEmail: "cvfd@chamberstx.gov",
    statusCheckUrl: null,
  });
  assert.match(approved.text, /Request status: Approved/);
  assert.match(approved.text, /October 6/);
  assert.equal(approved.subject.includes("\n"), false);
  assert.equal(approved.subject.includes("Bcc:"), false);
  assert.equal(approved.html.includes("<script>"), false);
  assert.match(approved.html, /&lt;script&gt;/);

  assert.deepEqual(
    shouldNotifyStatusChange({
      previousStatus: "approved",
      nextStatus: "approved",
      lastNotifiedStatus: "approved",
      previousNote: "",
      nextNote: "",
    }),
    { notify: false, reason: "already_notified" }
  );

  assert.equal(
    shouldNotifyStatusChange({
      previousStatus: "approved",
      nextStatus: "approved",
      lastNotifiedStatus: "pending",
      previousNote: "",
      nextNote: "",
    }).reason,
    "retry_unsent"
  );
});

test("the existing Night Out submission payload is still accepted", () => {
  const payload = validateNationalNightOutPayload({
    requesterName: "Neighborhood Lead",
    phone: "(281) 555-0100",
    email: "Neighbor@Example.com",
    neighborhood: "Cove Estates",
    address: "100 Main Street",
    city: "Cove",
    zipCode: "77523",
    preferredTime: "6:00 PM",
    estimatedAttendance: "40",
    accessInstructions: "",
    comments: "",
    disclaimerAccepted: true,
    website: "",
  });

  assert.equal(payload.email, "neighbor@example.com");
  assert.equal(payload.disclaimerAccepted, true);
  assert.throws(
    () => validateNationalNightOutPayload({ ...payload, disclaimerAccepted: false }),
    NationalNightOutValidationError
  );

  const status = validateNationalNightOutStatusUpdate({
    status: "under_review",
    statusNote: "Checking staffing.",
  });
  assert.equal(status.status, "under_review");
  assert.equal(NNO_STATUS_LABELS.pending, "Submitted");
  assert.equal(NNO_STATUS_LABELS.under_review, "Under Review");
  assert.throws(
    () => validateNationalNightOutStatusUpdate({ status: "archived" }),
    NationalNightOutValidationError
  );
});

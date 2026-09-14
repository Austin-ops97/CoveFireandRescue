import {
  NationalNightOutValidationError,
  buildNationalNightOutRequestId,
  normalizeNationalNightOutStatus,
  validateNationalNightOutPayload,
  validateNationalNightOutSettingsUpdate,
  validateNationalNightOutStatusUpdate,
} from "../lib/national-night-out/validation";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectThrow(fn: () => void, includes: string) {
  try {
    fn();
    throw new Error(`Expected throw containing: ${includes}`);
  } catch (error) {
    if (!(error instanceof NationalNightOutValidationError)) {
      throw error;
    }
    assert(error.message.includes(includes), `Expected "${includes}" in "${error.message}"`);
  }
}

const valid = {
  requesterName: "Jane Resident",
  phone: "(281) 555-0100",
  email: "Jane@Example.com",
  neighborhood: "Cove Oaks",
  address: "123 Main St",
  city: "Cove",
  zipCode: "77523",
  preferredTime: "6:00–7:00 PM",
  estimatedAttendance: "40",
  accessInstructions: "Gate code 1234",
  comments: "Kids will be present",
  disclaimerAccepted: true,
};

const result = validateNationalNightOutPayload(valid);
assert(result.email === "jane@example.com", "email should be lowercased");
assert(result.disclaimerAccepted === true, "disclaimer should remain true");
assert(result.accessInstructions === "Gate code 1234", "access instructions preserved");

expectThrow(
  () => validateNationalNightOutPayload({ ...valid, disclaimerAccepted: false }),
  "does not guarantee"
);
expectThrow(() => validateNationalNightOutPayload({ ...valid, zipCode: "ABC" }), "ZIP");
expectThrow(
  () => validateNationalNightOutPayload({ ...valid, website: "http://spam" }),
  "Unable to submit"
);
expectThrow(() => validateNationalNightOutPayload({ ...valid, requesterName: "" }), "Full name");

assert(
  validateNationalNightOutStatusUpdate({ status: "approved" }).status === "approved",
  "approve status"
);
assert(
  validateNationalNightOutStatusUpdate({ status: "under_review" }).status === "under_review",
  "under review status"
);
assert(
  validateNationalNightOutStatusUpdate({ status: "pending" }).status === "submitted",
  "legacy pending maps to submitted"
);
assert(normalizeNationalNightOutStatus("pending") === "submitted", "normalize pending");
assert(validateNationalNightOutSettingsUpdate({ enabled: true }).enabled === true, "settings enabled");
assert(buildNationalNightOutRequestId("abcdef123").startsWith("NNO-ABCDEF"), "request id format");

console.log("National Night Out validation checks passed.");

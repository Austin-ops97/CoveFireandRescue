import {
  ROSTER_ACTIVITY_STATUSES,
  ROSTER_UNIT_NUMBER_MAX,
  ROSTER_UNIT_NUMBER_MIN,
  type RosterActivityStatus,
  type RosterMemberFormState,
} from "./types";

export class RosterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterValidationError";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readActivityStatus(value: unknown): RosterActivityStatus {
  if (
    typeof value === "string" &&
    ROSTER_ACTIVITY_STATUSES.includes(value as RosterActivityStatus)
  ) {
    return value as RosterActivityStatus;
  }
  return "active";
}

/**
 * Normalize US-style phone numbers to (XXX) XXX-XXXX when 10 digits are present.
 * Otherwise return a cleaned trimmed string.
 */
export function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");

  let national = digits;
  if (digits.length === 11 && digits.startsWith("1")) {
    national = digits.slice(1);
  }

  if (national.length === 10) {
    return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  }

  return trimmed;
}

export function validateRosterMemberPayload(input: RosterMemberFormState): {
  unitNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  rank: string;
  activityStatus: RosterActivityStatus;
} {
  const unitRaw = String(input.unitNumber ?? "").trim();
  if (!/^\d+$/.test(unitRaw)) {
    throw new RosterValidationError("Unit number must be numeric.");
  }

  const unitNumber = Number.parseInt(unitRaw, 10);
  if (
    !Number.isInteger(unitNumber) ||
    unitNumber < ROSTER_UNIT_NUMBER_MIN ||
    unitNumber > ROSTER_UNIT_NUMBER_MAX
  ) {
    throw new RosterValidationError(
      `Unit number must be between ${ROSTER_UNIT_NUMBER_MIN} and ${ROSTER_UNIT_NUMBER_MAX}.`
    );
  }

  const firstName = input.firstName.trim();
  if (!firstName || firstName.length > 80) {
    throw new RosterValidationError("First name is required (80 characters max).");
  }

  const lastName = input.lastName.trim();
  if (!lastName || lastName.length > 80) {
    throw new RosterValidationError("Last name is required (80 characters max).");
  }

  const phoneInput = input.phone.trim();
  if (!phoneInput || phoneInput.length > 40) {
    throw new RosterValidationError("Phone number is required.");
  }
  const phone = normalizePhoneNumber(phoneInput);
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7) {
    throw new RosterValidationError("Enter a valid phone number.");
  }

  const email = input.email.trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 200) {
    throw new RosterValidationError("A valid email address is required.");
  }

  const rank = input.rank.trim();
  if (!rank || rank.length > 100) {
    throw new RosterValidationError("Rank is required (100 characters max).");
  }

  if (!ROSTER_ACTIVITY_STATUSES.includes(input.activityStatus)) {
    throw new RosterValidationError("Activity status is required.");
  }
  const activityStatus = readActivityStatus(input.activityStatus);

  return {
    unitNumber,
    firstName,
    lastName,
    phone,
    email,
    rank,
    activityStatus,
  };
}

import {
  ROSTER_ACTIVITY_STATUSES,
  ROSTER_UNIT_MAX,
  ROSTER_UNIT_MIN,
  type RosterActivityStatus,
  type RosterMemberInput,
  type RosterMemberRecord,
} from "./types";

export class RosterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterValidationError";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isRosterActivityStatus(value: unknown): value is RosterActivityStatus {
  return (
    typeof value === "string" &&
    (ROSTER_ACTIVITY_STATUSES as readonly string[]).includes(value)
  );
}

/** Format a US phone number as (###) ###-####. Returns null when it cannot. */
export function normalizePhoneNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  let national = digits;
  if (national.length === 11 && national.startsWith("1")) {
    national = national.slice(1);
  }
  if (national.length !== 10) return null;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

function readUnitNumber(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  throw new RosterValidationError("Unit number must be a whole number.");
}

export function validateRosterMemberPayload(input: unknown): RosterMemberInput {
  if (!input || typeof input !== "object") {
    throw new RosterValidationError("Invalid roster member.");
  }

  const payload = input as Record<string, unknown>;
  const unitNumber = readUnitNumber(payload.unitNumber);
  if (unitNumber < ROSTER_UNIT_MIN || unitNumber > ROSTER_UNIT_MAX) {
    throw new RosterValidationError(
      `Unit number must be between ${ROSTER_UNIT_MIN} and ${ROSTER_UNIT_MAX}.`
    );
  }

  const firstName = asTrimmedString(payload.firstName);
  const lastName = asTrimmedString(payload.lastName);
  if (!firstName || firstName.length > 80) {
    throw new RosterValidationError("First name is required (80 characters max).");
  }
  if (!lastName || lastName.length > 80) {
    throw new RosterValidationError("Last name is required (80 characters max).");
  }

  const phoneRaw = asTrimmedString(payload.phone);
  const phone = normalizePhoneNumber(phoneRaw);
  if (!phone) {
    throw new RosterValidationError("Enter a valid 10-digit phone number.");
  }

  const email = asTrimmedString(payload.email).toLowerCase();
  if (!email || email.length > 200 || !EMAIL_PATTERN.test(email)) {
    throw new RosterValidationError("A valid email address is required.");
  }

  const rank = asTrimmedString(payload.rank);
  if (!rank || rank.length > 80) {
    throw new RosterValidationError("Rank is required (80 characters max).");
  }

  if (!isRosterActivityStatus(payload.activityStatus)) {
    throw new RosterValidationError("Activity status must be Active or Non-Active.");
  }

  return {
    unitNumber,
    firstName,
    lastName,
    phone,
    email,
    rank,
    activityStatus: payload.activityStatus,
  };
}

export function findRosterDuplicate(
  existing: Pick<RosterMemberRecord, "id" | "unitNumber" | "email">[],
  candidate: Pick<RosterMemberInput, "unitNumber" | "email">,
  ignoreId?: string
): string | null {
  const email = candidate.email.trim().toLowerCase();

  for (const member of existing) {
    if (ignoreId && member.id === ignoreId) continue;
    if (member.unitNumber === candidate.unitNumber) {
      return `Unit ${candidate.unitNumber} is already on the roster.`;
    }
    if (member.email.trim().toLowerCase() === email) {
      return "A roster member with this email address already exists.";
    }
  }

  return null;
}

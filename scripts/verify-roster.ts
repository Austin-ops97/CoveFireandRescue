/**
 * Focused verification for roster validation, CSV export, and permission helpers.
 * Does not require Firebase credentials.
 */
import { canManageRoster, canViewRoster } from "../lib/auth/roles";
import { buildRosterCsv } from "../lib/roster/export";
import {
  RosterValidationError,
  normalizePhoneNumber,
  validateRosterMemberPayload,
} from "../lib/roster/validation";
import type { RosterMemberFormState, RosterMemberRecord } from "../lib/roster/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function expectThrow(fn: () => void, includes: string) {
  try {
    fn();
    throw new Error(`Expected throw containing: ${includes}`);
  } catch (error) {
    if (!(error instanceof RosterValidationError)) throw error;
    assert(error.message.includes(includes), `Expected "${includes}" in "${error.message}"`);
  }
}

// Permissions
assert(canViewRoster("member") === true, "member can view roster");
assert(canViewRoster("viewer") === true, "viewer can view roster");
assert(canManageRoster("member") === false, "member cannot manage roster");
assert(canManageRoster("viewer") === false, "viewer cannot manage roster");
assert(canManageRoster("editor") === true, "editor can manage roster");
assert(canManageRoster("admin") === true, "admin can manage roster");
assert(canManageRoster(null) === false, "null role cannot manage roster");

const valid: RosterMemberFormState = {
  unitNumber: "8910",
  firstName: "Alex",
  lastName: "Rivera",
  phone: "2815550199",
  email: "Alex.Rivera@Example.com",
  rank: "Firefighter",
  activityStatus: "active",
};

const created = validateRosterMemberPayload(valid);
assert(created.unitNumber === 8910, "unit number parsed");
assert(created.email === "alex.rivera@example.com", "email lowercased");
assert(created.phone === "(281) 555-0199", "phone normalized");
assert(created.activityStatus === "active", "activity status preserved");

expectThrow(
  () => validateRosterMemberPayload({ ...valid, unitNumber: "8800" }),
  "between"
);
expectThrow(
  () => validateRosterMemberPayload({ ...valid, firstName: "" }),
  "First name"
);
expectThrow(
  () => validateRosterMemberPayload({ ...valid, email: "not-an-email" }),
  "email"
);
expectThrow(
  () => validateRosterMemberPayload({ ...valid, rank: "" }),
  "Rank"
);
expectThrow(
  () =>
    validateRosterMemberPayload({
      ...valid,
      activityStatus: "retired" as RosterMemberFormState["activityStatus"],
    }),
  "Activity status"
);

assert(normalizePhoneNumber("1 (409) 692-0044") === "(409) 692-0044", "11-digit phone");

const members: RosterMemberRecord[] = [
  {
    id: "1",
    unitNumber: 8910,
    firstName: "Alex",
    lastName: "Rivera",
    phone: "(281) 555-0199",
    email: "alex.rivera@example.com",
    rank: "Firefighter",
    activityStatus: "active",
  },
  {
    id: "2",
    unitNumber: 8920,
    firstName: "Jordan",
    lastName: "Lee",
    phone: "(281) 555-0120",
    email: "jordan.lee@example.com",
    rank: "Captain",
    activityStatus: "non_active",
  },
];

const csv = buildRosterCsv(members);
assert(csv.includes("Unit Number,Name,Phone #,Email,Rank,Activity Status"), "csv header");
assert(csv.includes("8910,Alex Rivera"), "csv row");
assert(csv.includes("Non-Active"), "csv status label");
assert(!csv.includes("Edit"), "csv has no UI controls");

// Filter/search simulation
const query = "captain";
const filtered = members.filter((member) =>
  [member.rank, member.firstName, member.lastName, String(member.unitNumber)]
    .join(" ")
    .toLowerCase()
    .includes(query)
);
assert(filtered.length === 1 && filtered[0]!.unitNumber === 8920, "filter/search works");

console.log("Roster verification checks passed.");

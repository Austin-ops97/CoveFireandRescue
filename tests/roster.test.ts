import assert from "node:assert/strict";
import test from "node:test";
import { canManageRoster, canViewRoster } from "../lib/auth/roles";
import { buildRosterCsv, ROSTER_EXPORT_HEADERS } from "../lib/roster/export";
import { queryRosterMembers, rosterDisplayName } from "../lib/roster/query";
import type { RosterMemberRecord } from "../lib/roster/types";
import {
  findRosterDuplicate,
  normalizePhoneNumber,
  RosterValidationError,
  validateRosterMemberPayload,
} from "../lib/roster/validation";

function member(overrides: Partial<RosterMemberRecord> = {}): RosterMemberRecord {
  return {
    id: "8901",
    unitNumber: 8901,
    firstName: "Ada",
    lastName: "Lovelace",
    phone: "(281) 555-0100",
    email: "ada@example.com",
    rank: "Captain",
    activityStatus: "active",
    ...overrides,
  };
}

test("authorized officers can manage the roster and other dashboard roles can view it", () => {
  assert.equal(canManageRoster("admin"), true);
  assert.equal(canManageRoster("editor"), true);
  assert.equal(canManageRoster("member"), false);
  assert.equal(canManageRoster("viewer"), false);
  assert.equal(canManageRoster(null), false);
  assert.equal(canViewRoster("member"), true);
  assert.equal(canViewRoster("viewer"), true);
  assert.equal(canViewRoster("editor"), true);
  assert.equal(canViewRoster(null), false);
});

test("an authorized payload creates a roster member and blocks duplicates", () => {
  const created = validateRosterMemberPayload({
    unitNumber: "8904",
    firstName: "Grace",
    lastName: "Hopper",
    phone: "2815550199",
    email: "Grace@Example.com",
    rank: "Chief",
    activityStatus: "active",
  });

  assert.equal(created.unitNumber, 8904);
  assert.equal(created.phone, "(281) 555-0199");
  assert.equal(created.email, "grace@example.com");
  assert.equal(findRosterDuplicate([], created), null);

  const stored = member({
    id: "8904",
    unitNumber: created.unitNumber,
    email: created.email,
    firstName: created.firstName,
    lastName: created.lastName,
  });
  assert.match(findRosterDuplicate([stored], created) ?? "", /already on the roster/);
  assert.match(
    findRosterDuplicate([member({ unitNumber: 8908, email: created.email })], created) ?? "",
    /email address already exists/
  );
});

test("unauthorized role cannot pass the manage check used before writes", () => {
  assert.equal(canManageRoster("member"), false);
  assert.equal(canViewRoster("member"), true);
});

test("a roster member can be edited without tripping its own duplicate check", () => {
  const existing = member();
  const edited = validateRosterMemberPayload({
    ...existing,
    rank: "Assistant Chief",
    phone: "281-555-0101",
    activityStatus: "non_active",
  });

  assert.equal(edited.rank, "Assistant Chief");
  assert.equal(edited.phone, "(281) 555-0101");
  assert.equal(edited.activityStatus, "non_active");
  assert.equal(findRosterDuplicate([existing], edited, existing.id), null);
  assert.throws(() => validateRosterMemberPayload({ ...edited, unitNumber: 1000 }), RosterValidationError);
});

test("removing a member clears the duplicate so the unit can be added again", () => {
  const existing = member();
  const remaining = [existing].filter((item) => item.id !== existing.id);
  assert.equal(remaining.length, 0);
  assert.equal(findRosterDuplicate(remaining, existing), null);
});

test("search, rank filter, activity filter, and sort work", () => {
  const roster = [
    member({ id: "8910", unitNumber: 8910, firstName: "Grace", lastName: "Hopper", rank: "Chief" }),
    member({
      id: "8902",
      unitNumber: 8902,
      firstName: "Alan",
      lastName: "Turing",
      email: "alan@example.com",
      rank: "Firefighter",
      activityStatus: "non_active",
      phone: "(409) 555-0142",
    }),
  ];

  const byName = queryRosterMembers(roster, {
    search: "tur",
    rank: "all",
    activityStatus: "all",
    sort: "name",
    direction: "asc",
  });
  assert.deepEqual(byName.map((item) => item.unitNumber), [8902]);

  const captains = queryRosterMembers(roster, {
    search: "",
    rank: "Chief",
    activityStatus: "active",
    sort: "unit",
    direction: "desc",
  });
  assert.deepEqual(captains.map((item) => item.unitNumber), [8910]);

  const byPhone = queryRosterMembers(roster, {
    search: "409555",
    rank: "all",
    activityStatus: "all",
    sort: "unit",
    direction: "asc",
  });
  assert.equal(byPhone.length, 1);
  assert.equal(rosterDisplayName(byPhone[0]), "Alan Turing");
});

test("print and export rows contain the roster columns and neutralize spreadsheet formulas", () => {
  const rows = [
    member({
      firstName: "=Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
    }),
  ];
  const csv = buildRosterCsv(rows);

  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /Unit Number,Name,Phone #,Email,Rank,Activity Status/);
  assert.deepEqual([...ROSTER_EXPORT_HEADERS], [
    "Unit Number",
    "Name",
    "Phone #",
    "Email",
    "Rank",
    "Activity Status",
  ]);
  assert.match(csv, /'=Ada Lovelace/);
  assert.match(csv, /Active/);
  assert.equal(csv.includes("Edit"), false);
  assert.equal(normalizePhoneNumber("12815550100"), "(281) 555-0100");
});

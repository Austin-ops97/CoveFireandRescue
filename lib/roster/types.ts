/**
 * Activity statuses are a closed list so the UI, validation, and exports stay
 * aligned. Add a new value here to support another status later.
 */
export const ROSTER_ACTIVITY_STATUSES = ["active", "non_active"] as const;

export type RosterActivityStatus = (typeof ROSTER_ACTIVITY_STATUSES)[number];

export const ROSTER_ACTIVITY_LABELS: Record<RosterActivityStatus, string> = {
  active: "Active",
  non_active: "Non-Active",
};

export const ROSTER_UNIT_MIN = 8901;
export const ROSTER_UNIT_MAX = 8999;

/** Suggestions only. Officers can store another rank title. */
export const ROSTER_RANK_SUGGESTIONS = [
  "Chief",
  "Assistant Chief",
  "Deputy Chief",
  "Captain",
  "Lieutenant",
  "Engineer",
  "Firefighter",
  "Probationary Firefighter",
  "EMS",
  "Support",
] as const;

export type RosterMemberRecord = {
  id: string;
  unitNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  rank: string;
  activityStatus: RosterActivityStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RosterMemberInput = {
  unitNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  rank: string;
  activityStatus: RosterActivityStatus;
};

export type RosterSortField = "unit" | "name";
export type RosterSortDirection = "asc" | "desc";

export type RosterListQuery = {
  search: string;
  rank: string;
  activityStatus: "all" | RosterActivityStatus;
  sort: RosterSortField;
  direction: RosterSortDirection;
};

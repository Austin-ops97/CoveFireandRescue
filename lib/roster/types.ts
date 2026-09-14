export const ROSTER_ACTIVITY_STATUSES = ["active", "non_active"] as const;
export type RosterActivityStatus = (typeof ROSTER_ACTIVITY_STATUSES)[number];

export const ROSTER_ACTIVITY_STATUS_LABELS: Record<RosterActivityStatus, string> = {
  active: "Active",
  non_active: "Non-Active",
};

/** Common department ranks — free-text rank is also allowed after validation. */
export const ROSTER_RANK_OPTIONS = [
  "Fire Chief",
  "Assistant Chief",
  "Deputy Chief",
  "Captain",
  "Lieutenant",
  "Engineer",
  "Firefighter",
  "Firefighter / EMT",
  "Probationary Firefighter",
  "Cadet",
  "Support Staff",
  "Other",
] as const;

export const ROSTER_UNIT_NUMBER_MIN = 8901;
export const ROSTER_UNIT_NUMBER_MAX = 8999;

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

export type RosterMemberFormState = {
  id?: string;
  unitNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  rank: string;
  activityStatus: RosterActivityStatus;
};

export function getRosterActivityStatusLabel(status: RosterActivityStatus): string {
  return ROSTER_ACTIVITY_STATUS_LABELS[status] ?? status;
}

export function formatRosterMemberName(member: Pick<RosterMemberRecord, "firstName" | "lastName">): string {
  return `${member.lastName}, ${member.firstName}`.trim();
}

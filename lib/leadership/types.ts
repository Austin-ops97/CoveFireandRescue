export type LeadershipMemberStatus = "active" | "inactive" | "archived";

export type LeadershipMemberRecord = {
  id: string;
  name: string;
  rank: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  bio: string;
  photoFileId?: string | null;
  photoUrl?: string | null;
  status: LeadershipMemberStatus;
  active: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LeadershipMemberFormState = {
  id?: string;
  name: string;
  rank: string;
  title: string;
  email: string;
  phone: string;
  bio: string;
  photoFileId: string;
  status: LeadershipMemberStatus;
  active: boolean;
  sortOrder: string;
};

export const LEADERSHIP_STATUSES: Array<{
  value: LeadershipMemberStatus;
  label: string;
}> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export const COMMON_LEADERSHIP_RANKS = [
  "Fire Chief",
  "Assistant Chief",
  "Deputy Chief",
  "Captain",
  "Lieutenant",
  "Training Officer",
  "Safety Officer",
  "Firefighter",
  "Administrative Staff",
  "Other",
] as const;

export function getLeadershipStatusLabel(status: LeadershipMemberStatus): string {
  return LEADERSHIP_STATUSES.find((item) => item.value === status)?.label ?? status;
}

import { ROSTER_ACTIVITY_LABELS } from "./types";
import type { RosterListQuery, RosterMemberRecord } from "./types";

export function rosterDisplayName(member: Pick<RosterMemberRecord, "firstName" | "lastName">): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function queryRosterMembers(
  members: RosterMemberRecord[],
  query: RosterListQuery
): RosterMemberRecord[] {
  const search = query.search.trim().toLowerCase();
  const searchDigits = digitsOnly(search);

  const filtered = members.filter((member) => {
    if (query.activityStatus !== "all" && member.activityStatus !== query.activityStatus) {
      return false;
    }
    if (query.rank !== "all" && member.rank !== query.rank) {
      return false;
    }
    if (!search) return true;

    const haystack = [
      String(member.unitNumber),
      member.firstName,
      member.lastName,
      rosterDisplayName(member),
      member.email,
      member.phone,
      member.rank,
      ROSTER_ACTIVITY_LABELS[member.activityStatus],
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(search)) return true;
    if (searchDigits.length >= 3 && digitsOnly(member.phone).includes(searchDigits)) return true;
    return false;
  });

  const direction = query.direction === "desc" ? -1 : 1;

  return [...filtered].sort((a, b) => {
    if (query.sort === "name") {
      const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
      if (last !== 0) return last * direction;
      const first = a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
      if (first !== 0) return first * direction;
      return (a.unitNumber - b.unitNumber) * direction;
    }

    if (a.unitNumber !== b.unitNumber) {
      return (a.unitNumber - b.unitNumber) * direction;
    }
    return a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
  });
}

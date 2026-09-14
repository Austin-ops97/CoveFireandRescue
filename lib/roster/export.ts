import type { RosterMemberRecord } from "./types";

export function buildRosterCsv(members: RosterMemberRecord[]): string {
  const header = ["Unit Number", "Name", "Phone #", "Email", "Rank", "Activity Status"];
  const rows = members.map((member) => [
    String(member.unitNumber),
    `${member.firstName} ${member.lastName}`.trim(),
    member.phone,
    member.email,
    member.rank,
    member.activityStatus === "active" ? "Active" : "Non-Active",
  ]);

  const escapeCell = (value: string): string => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  return [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

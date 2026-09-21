import { rosterDisplayName } from "./query";
import { ROSTER_ACTIVITY_LABELS } from "./types";
import type { RosterMemberRecord } from "./types";

export const ROSTER_EXPORT_HEADERS = [
  "Unit Number",
  "Name",
  "Phone #",
  "Email",
  "Rank",
  "Activity Status",
] as const;

export type RosterExportRow = {
  unitNumber: string;
  name: string;
  phone: string;
  email: string;
  rank: string;
  activityStatus: string;
};

export function rosterExportRows(members: RosterMemberRecord[]): RosterExportRow[] {
  return members.map((member) => ({
    unitNumber: String(member.unitNumber),
    name: rosterDisplayName(member),
    phone: member.phone,
    email: member.email,
    rank: member.rank,
    activityStatus: ROSTER_ACTIVITY_LABELS[member.activityStatus],
  }));
}

function escapeCsvCell(value: string): string {
  let cell = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/^[=+\-@\t]/.test(cell)) {
    cell = `'${cell}`;
  }
  if (/[",\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/** UTF-8 CSV with a leading BOM so Excel opens the department roster correctly. */
export function buildRosterCsv(members: RosterMemberRecord[]): string {
  const lines = [
    ROSTER_EXPORT_HEADERS.map((header) => escapeCsvCell(header)).join(","),
    ...rosterExportRows(members).map((row) =>
      [row.unitNumber, row.name, row.phone, row.email, row.rank, row.activityStatus]
        .map((cell) => escapeCsvCell(cell))
        .join(",")
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

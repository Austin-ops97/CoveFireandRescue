export const DEPARTMENT_EMAIL_USERNAME_PATTERN = /^[a-z0-9_-]+$/;

export const LEADERSHIP_ALIAS_USERNAMES = [
  "chief",
  "assistantchief",
  "training",
  "secretary",
  "treasurer",
  "president",
] as const;

export type LeadershipAliasUsername = (typeof LEADERSHIP_ALIAS_USERNAMES)[number];

export function normalizeNamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "")
    .trim();
}

export function buildMemberEmailUsernameCandidates(
  firstName: string,
  lastName: string
): string[] {
  const first = normalizeNamePart(firstName);
  const last = normalizeNamePart(lastName);

  if (!first || !last) return [];

  const candidates: string[] = [];
  for (let length = 1; length <= first.length; length += 1) {
    candidates.push(`${first.slice(0, length)}_${last}`);
  }

  const base = `${first.charAt(0)}_${last}`;
  for (let suffix = 2; suffix <= 99; suffix += 1) {
    candidates.push(`${base}${suffix}`);
  }

  return candidates;
}

export function suggestDepartmentEmailUsername(
  firstName: string,
  lastName: string
): string {
  return buildMemberEmailUsernameCandidates(firstName, lastName)[0] ?? "";
}

export function buildDepartmentEmailAddress(
  emailUsername: string,
  domain: string
): string {
  return `${emailUsername}@${domain}`;
}

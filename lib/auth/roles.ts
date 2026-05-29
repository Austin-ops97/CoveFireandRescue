export const USER_ROLES = ["admin", "member"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function canAccessDashboard(role: string | null | undefined): boolean {
  return role === "admin" || role === "member";
}

export function canManageContent(role: string | null | undefined): boolean {
  return role === "admin";
}

export function canSubmitRounds(role: string | null | undefined): boolean {
  return role === "admin" || role === "member";
}

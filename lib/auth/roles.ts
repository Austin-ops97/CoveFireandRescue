export const USER_ROLES = ["admin", "editor", "viewer", "member"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const MANAGE_CONTENT_ROLES: UserRole[] = ["admin", "editor"];

export const DASHBOARD_ROLES: UserRole[] = ["admin", "editor", "viewer", "member"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function canAccessDashboard(role: string | null | undefined): boolean {
  return role === "admin" || role === "editor" || role === "viewer" || role === "member";
}

export function canManageContent(role: string | null | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function canManageUsers(role: string | null | undefined): boolean {
  return role === "admin";
}

export function canSubmitRounds(role: string | null | undefined): boolean {
  return role === "admin" || role === "editor" || role === "member";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    case "member":
      return "Firefighter";
    default:
      return role;
  }
}

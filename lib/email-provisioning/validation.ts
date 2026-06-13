import {
  DEPARTMENT_EMAIL_USERNAME_PATTERN,
  LEADERSHIP_ALIAS_USERNAMES,
  buildMemberEmailUsernameCandidates,
  normalizeNamePart,
} from "@/lib/email-provisioning/usernames";
import { normalizeOptionalString } from "@/lib/users/validation";

export {
  DEPARTMENT_EMAIL_USERNAME_PATTERN,
  LEADERSHIP_ALIAS_USERNAMES,
  buildDepartmentEmailAddress,
  buildMemberEmailUsernameCandidates,
  suggestDepartmentEmailUsername,
} from "@/lib/email-provisioning/usernames";

export const DEPARTMENT_EMAIL_QUOTA_OPTIONS = [1024, 2048, 5120, 0] as const;

export type DepartmentEmailQuotaMb = (typeof DEPARTMENT_EMAIL_QUOTA_OPTIONS)[number];

export type CreateAccountType = "member" | "alias";

const MIN_PASSWORD_LENGTH = 8;

export function validateDepartmentEmailUsername(value: unknown): string | Error {
  if (typeof value !== "string" || !value.trim()) {
    return new Error("Email username is required.");
  }

  const username = value.trim().toLowerCase();
  if (!DEPARTMENT_EMAIL_USERNAME_PATTERN.test(username)) {
    return new Error(
      "Email username may only contain lowercase letters, numbers, underscores, and hyphens."
    );
  }

  if (username.startsWith("_") || username.endsWith("_")) {
    return new Error("Email username cannot start or end with an underscore.");
  }

  return username;
}

export function validateAliasEmailUsername(value: unknown): string | Error {
  const username = validateDepartmentEmailUsername(value);
  if (username instanceof Error) return username;

  if (!LEADERSHIP_ALIAS_USERNAMES.includes(username as (typeof LEADERSHIP_ALIAS_USERNAMES)[number])) {
    return new Error("Select a supported department alias address.");
  }

  return username;
}

export function validateStrongPassword(value: unknown): string | Error {
  if (typeof value !== "string" || value.length < MIN_PASSWORD_LENGTH) {
    return new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    return new Error(
      "Password must include uppercase, lowercase, a number, and a special character."
    );
  }

  return value;
}

export function validateDepartmentEmailQuota(
  value: unknown,
  supportsUnlimited: boolean
): DepartmentEmailQuotaMb | Error {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isFinite(numeric)) {
    return new Error("Select a valid mailbox quota.");
  }

  if (numeric === 0 && !supportsUnlimited) {
    return new Error("Unlimited mailbox quota is not available on this server.");
  }

  if (!DEPARTMENT_EMAIL_QUOTA_OPTIONS.includes(numeric as DepartmentEmailQuotaMb)) {
    return new Error("Select a valid mailbox quota.");
  }

  return numeric as DepartmentEmailQuotaMb;
}

export type DepartmentEmailInput = {
  emailUsername: string;
  password: string;
  confirmPassword: string;
  quotaMb: DepartmentEmailQuotaMb;
};

export function parseDepartmentEmailBody(
  body: Record<string, unknown>,
  supportsUnlimited: boolean
): DepartmentEmailInput | Error {
  const emailUsername = validateDepartmentEmailUsername(body.emailUsername);
  if (emailUsername instanceof Error) return emailUsername;

  const password = validateStrongPassword(body.password);
  if (password instanceof Error) return password;

  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  if (password !== confirmPassword) {
    return new Error("Password and confirm password must match.");
  }

  const quotaMb = validateDepartmentEmailQuota(body.quotaMb, supportsUnlimited);
  if (quotaMb instanceof Error) return quotaMb;

  return {
    emailUsername,
    password,
    confirmPassword,
    quotaMb,
  };
}

export type CreateMemberUserInput = {
  accountType: "member";
  firstName: string;
  lastName: string;
  role: import("@/lib/auth/roles").UserRole;
  active: boolean;
  departmentEmailUsername: string;
  password: string;
  confirmPassword: string;
  quotaMb: DepartmentEmailQuotaMb;
};

export type CreateAliasUserInput = {
  accountType: "alias";
  aliasUsername: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  quotaMb: DepartmentEmailQuotaMb;
};

export type CreatePortalUserInput = CreateMemberUserInput | CreateAliasUserInput;

export function parseCreatePortalUserBody(
  body: Record<string, unknown>,
  supportsUnlimited: boolean
): CreatePortalUserInput | Error {
  const accountType = body.accountType === "alias" ? "alias" : "member";

  const password = validateStrongPassword(body.password);
  if (password instanceof Error) return password;

  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  if (password !== confirmPassword) {
    return new Error("Password and confirm password must match.");
  }

  const quotaMb = validateDepartmentEmailQuota(body.quotaMb, supportsUnlimited);
  if (quotaMb instanceof Error) return quotaMb;

  if (accountType === "alias") {
    const aliasUsername = validateAliasEmailUsername(body.aliasUsername);
    if (aliasUsername instanceof Error) return aliasUsername;

    const displayName = normalizeOptionalString(body.displayName);
    if (!displayName) {
      return new Error("Display name is required for department alias accounts.");
    }

    return {
      accountType: "alias",
      aliasUsername,
      displayName,
      password,
      confirmPassword,
      quotaMb,
    };
  }

  const firstName = normalizeOptionalString(body.firstName);
  if (!firstName) return new Error("First name is required.");

  const lastName = normalizeOptionalString(body.lastName);
  if (!lastName) return new Error("Last name is required.");

  const departmentEmailUsername = validateDepartmentEmailUsername(
    body.departmentEmailUsername
  );
  if (departmentEmailUsername instanceof Error) return departmentEmailUsername;

  const role = body.role;
  if (role !== "admin" && role !== "editor" && role !== "viewer" && role !== "member") {
    return new Error("Invalid role.");
  }

  if (typeof body.active !== "boolean") {
    return new Error("Status must be active or inactive.");
  }

  const normalizedFirst = normalizeNamePart(firstName);
  const normalizedLast = normalizeNamePart(lastName);
  if (!normalizedFirst || !normalizedLast) {
    return new Error("First and last name must contain valid letters.");
  }

  return {
    accountType: "member",
    firstName,
    lastName,
    role,
    active: body.active,
    departmentEmailUsername,
    password,
    confirmPassword,
    quotaMb,
  };
}

export function usernameSupportsAutoResolve(
  firstName: string,
  lastName: string,
  username: string
): boolean {
  const candidates = buildMemberEmailUsernameCandidates(firstName, lastName);
  return candidates.includes(username);
}

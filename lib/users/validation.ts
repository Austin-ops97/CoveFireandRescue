import { isUserRole, type UserRole } from "@/lib/auth/roles";
import {
  parseCreateUserDepartmentEmail,
  type CreateUserDepartmentEmailInput,
} from "@/lib/email-provisioning/validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function normalizeOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeRequiredString(value: unknown, fieldName: string): string | Error {
  if (typeof value !== "string" || !value.trim()) {
    return new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

export function validateEmail(value: string): string | Error {
  const trimmed = value.trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    return new Error("Enter a valid email address.");
  }
  return trimmed.toLowerCase();
}

export function validateRole(value: unknown): UserRole | Error {
  if (!isUserRole(value)) {
    return new Error("Invalid role.");
  }
  return value;
}

export function validateActive(value: unknown): boolean | Error {
  if (typeof value !== "boolean") {
    return new Error("Status must be active or inactive.");
  }
  return value;
}

export function validateTemporaryPassword(value: unknown): string | Error {
  if (typeof value !== "string" || value.length < MIN_PASSWORD_LENGTH) {
    return new Error(`Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return value;
}

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  active: boolean;
  phone: string | null;
  title: string | null;
  passwordMode: "temporary" | "reset_link";
  temporaryPassword: string | null;
  departmentEmail: CreateUserDepartmentEmailInput;
};

export function parseCreateUserBody(
  body: Record<string, unknown>,
  supportsUnlimited = true
): CreateUserInput | Error {
  const firstName = normalizeRequiredString(body.firstName, "First name");
  if (firstName instanceof Error) return firstName;

  const lastName = normalizeRequiredString(body.lastName, "Last name");
  if (lastName instanceof Error) return lastName;

  if (typeof body.email !== "string") {
    return new Error("Email is required.");
  }
  const email = validateEmail(body.email);
  if (email instanceof Error) return email;

  const role = validateRole(body.role);
  if (role instanceof Error) return role;

  const active = validateActive(body.active);
  if (active instanceof Error) return active;

  const passwordMode =
    body.passwordMode === "reset_link" ? "reset_link" : "temporary";

  let temporaryPassword: string | null = null;
  if (passwordMode === "temporary") {
    const password = validateTemporaryPassword(body.temporaryPassword);
    if (password instanceof Error) return password;
    temporaryPassword = password;
  }

  const departmentEmail = parseCreateUserDepartmentEmail(body, supportsUnlimited);
  if (departmentEmail instanceof Error) return departmentEmail;

  return {
    firstName,
    lastName,
    email,
    role,
    active,
    phone: normalizeOptionalString(body.phone),
    title: normalizeOptionalString(body.title),
    passwordMode,
    temporaryPassword,
    departmentEmail,
  };
}

export type UpdateUserInput = {
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  phone: string | null;
  title: string | null;
};

export function parseUpdateUserBody(body: Record<string, unknown>): UpdateUserInput | Error {
  const firstName = normalizeRequiredString(body.firstName, "First name");
  if (firstName instanceof Error) return firstName;

  const lastName = normalizeRequiredString(body.lastName, "Last name");
  if (lastName instanceof Error) return lastName;

  const role = validateRole(body.role);
  if (role instanceof Error) return role;

  const active = validateActive(body.active);
  if (active instanceof Error) return active;

  return {
    firstName,
    lastName,
    role,
    active,
    phone: normalizeOptionalString(body.phone),
    title: normalizeOptionalString(body.title),
  };
}

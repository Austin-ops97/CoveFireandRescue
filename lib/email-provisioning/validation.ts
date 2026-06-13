import { normalizeOptionalString } from "@/lib/users/validation";

export const DEPARTMENT_EMAIL_USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export const DEPARTMENT_EMAIL_QUOTA_OPTIONS = [1024, 2048, 5120, 0] as const;

export type DepartmentEmailQuotaMb = (typeof DEPARTMENT_EMAIL_QUOTA_OPTIONS)[number];

const MIN_EMAIL_PASSWORD_LENGTH = 8;

export function suggestDepartmentEmailUsername(
  firstName: string,
  lastName: string
): string {
  const normalizePart = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 32);

  const first = normalizePart(firstName);
  const last = normalizePart(lastName);

  if (first && last) return `${first}.${last}`;
  if (first) return first;
  if (last) return last;
  return "";
}

export function validateDepartmentEmailUsername(value: unknown): string | Error {
  if (typeof value !== "string" || !value.trim()) {
    return new Error("Email username is required.");
  }

  const username = value.trim().toLowerCase();
  if (!DEPARTMENT_EMAIL_USERNAME_PATTERN.test(username)) {
    return new Error(
      "Email username may only contain lowercase letters, numbers, dots, hyphens, and underscores."
    );
  }

  if (username.startsWith(".") || username.endsWith(".") || username.includes("..")) {
    return new Error("Email username cannot start or end with a dot.");
  }

  return username;
}

export function validateStrongEmailPassword(value: unknown): string | Error {
  if (typeof value !== "string" || value.length < MIN_EMAIL_PASSWORD_LENGTH) {
    return new Error(
      `Email password must be at least ${MIN_EMAIL_PASSWORD_LENGTH} characters.`
    );
  }

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    return new Error(
      "Email password must include uppercase, lowercase, a number, and a special character."
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

  const password = validateStrongEmailPassword(body.password);
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

export type CreateUserDepartmentEmailInput = {
  enabled: boolean;
  emailUsername: string | null;
  password: string | null;
  confirmPassword: string | null;
  quotaMb: DepartmentEmailQuotaMb | null;
};

export function parseCreateUserDepartmentEmail(
  body: Record<string, unknown>,
  supportsUnlimited: boolean
): CreateUserDepartmentEmailInput | Error {
  const enabled = body.createDepartmentEmail === true;
  if (!enabled) {
    return {
      enabled: false,
      emailUsername: null,
      password: null,
      confirmPassword: null,
      quotaMb: null,
    };
  }

  const emailUsername = validateDepartmentEmailUsername(body.departmentEmailUsername);
  if (emailUsername instanceof Error) return emailUsername;

  const password = validateStrongEmailPassword(body.departmentEmailPassword);
  if (password instanceof Error) return password;

  const confirmPassword =
    typeof body.departmentEmailPasswordConfirm === "string"
      ? body.departmentEmailPasswordConfirm
      : "";
  if (password !== confirmPassword) {
    return new Error("Department email password and confirm password must match.");
  }

  const quotaMb = validateDepartmentEmailQuota(body.departmentEmailQuota, supportsUnlimited);
  if (quotaMb instanceof Error) return quotaMb;

  return {
    enabled: true,
    emailUsername,
    password,
    confirmPassword,
    quotaMb,
  };
}

export function normalizeDepartmentEmailUsername(value: unknown): string | null {
  const normalized = normalizeOptionalString(value);
  if (!normalized) return null;
  const validated = validateDepartmentEmailUsername(normalized);
  return validated instanceof Error ? null : validated;
}

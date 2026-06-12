import type { UserRole } from "@/lib/auth/roles";

export type ManagedUserRole = UserRole;

export type UserStatus = "active" | "inactive";

export type PasswordSetupMode = "temporary" | "reset_link";

export type ManagedUserProfile = {
  uid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
  title: string | null;
  role: ManagedUserRole;
  active: boolean;
  createdBy: string | null;
  lastLoginAt: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateUserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  role: ManagedUserRole;
  active: boolean;
  phone: string;
  title: string;
  passwordMode: PasswordSetupMode;
  temporaryPassword: string;
};

export type EditUserFormState = {
  firstName: string;
  lastName: string;
  role: ManagedUserRole;
  active: boolean;
  phone: string;
  title: string;
};

export type ResetPasswordFormState = {
  mode: PasswordSetupMode;
  temporaryPassword: string;
};

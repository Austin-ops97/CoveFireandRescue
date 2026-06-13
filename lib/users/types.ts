import type { UserRole } from "@/lib/auth/roles";

export type ManagedUserRole = UserRole;

export type UserStatus = "active" | "inactive";

export type PasswordSetupMode = "temporary" | "reset_link";

export type EmailProvisioningStatus = "none" | "pending" | "provisioned" | "failed";

export type AuthProvisioningStatus = "none" | "pending" | "active" | "failed";

export type CreateAccountType = "member" | "alias";

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
  departmentEmail: string | null;
  emailProvisioningStatus: EmailProvisioningStatus;
  emailProvisioningError: string | null;
  authProvisioningStatus: AuthProvisioningStatus;
  authProvisioningError: string | null;
  isDepartmentAlias: boolean;
  isPendingAuth: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateUserFormState = {
  accountType: CreateAccountType;
  firstName: string;
  lastName: string;
  aliasUsername: string;
  aliasDisplayName: string;
  departmentEmailUsername: string;
  departmentEmailUsernameEdited: boolean;
  role: ManagedUserRole;
  active: boolean;
  password: string;
  confirmPassword: string;
  departmentEmailQuota: 1024 | 2048 | 5120 | 0;
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

export type RetryPortalAuthFormState = {
  password: string;
  confirmPassword: string;
};

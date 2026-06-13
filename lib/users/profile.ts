import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import type {
  AuthProvisioningStatus,
  EmailProvisioningStatus,
  ManagedUserProfile,
} from "@/lib/users/types";

export function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
  fallback?: string | null
): string | null {
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (fallback?.trim()) return fallback.trim();
  return null;
}

export function serializeTimestamp(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
}

export function readProfileRole(value: unknown): UserRole {
  if (isUserRole(value)) return value;
  return "member";
}

function readEmailProvisioningStatus(value: unknown): EmailProvisioningStatus {
  if (
    value === "none" ||
    value === "pending" ||
    value === "provisioned" ||
    value === "failed"
  ) {
    return value;
  }
  return "none";
}

function readAuthProvisioningStatus(
  value: unknown,
  uid: string,
  isDepartmentAlias: boolean,
  isPendingAuth: boolean
): AuthProvisioningStatus {
  if (isDepartmentAlias) return "none";
  if (isPendingAuth) return "failed";
  if (
    value === "none" ||
    value === "pending" ||
    value === "active" ||
    value === "failed"
  ) {
    return value;
  }
  if (uid.startsWith("pending_")) return "failed";
  if (uid.startsWith("alias_")) return "none";
  return "active";
}

export function toManagedUserProfile(
  uid: string,
  data: Record<string, unknown>,
  lastLoginAt?: string | null
): ManagedUserProfile {
  const firstName = typeof data.firstName === "string" ? data.firstName : null;
  const lastName = typeof data.lastName === "string" ? data.lastName : null;
  const legacyDisplayName = typeof data.displayName === "string" ? data.displayName : null;
  const isDepartmentAlias = data.isDepartmentAlias === true;
  const isPendingAuth = data.isPendingAuth === true;

  return {
    uid,
    email: typeof data.email === "string" ? data.email : null,
    firstName,
    lastName,
    displayName: buildDisplayName(firstName, lastName, legacyDisplayName),
    phone: typeof data.phone === "string" ? data.phone : null,
    title: typeof data.title === "string" ? data.title : null,
    role: readProfileRole(data.role),
    active: data.active === true,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : null,
    lastLoginAt: lastLoginAt ?? serializeTimestamp(data.lastLoginAt),
    departmentEmail:
      typeof data.departmentEmail === "string" ? data.departmentEmail : null,
    emailProvisioningStatus: readEmailProvisioningStatus(data.emailProvisioningStatus),
    emailProvisioningError:
      typeof data.emailProvisioningError === "string"
        ? data.emailProvisioningError
        : null,
    authProvisioningStatus: readAuthProvisioningStatus(
      data.authProvisioningStatus,
      uid,
      isDepartmentAlias,
      isPendingAuth
    ),
    authProvisioningError:
      typeof data.authProvisioningError === "string" ? data.authProvisioningError : null,
    isDepartmentAlias,
    isPendingAuth,
    createdAt: serializeTimestamp(data.createdAt) ?? data.createdAt ?? null,
    updatedAt: serializeTimestamp(data.updatedAt) ?? data.updatedAt ?? null,
  };
}

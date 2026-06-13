import "server-only";

import type { UserRecord } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { buildDisplayName } from "@/lib/users/profile";

export class UserAdminError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "UserAdminError";
    this.status = status;
    this.code = code;
  }
}

function mapAuthError(error: unknown): UserAdminError {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "auth_error";

  if (code === "auth/email-already-exists") {
    return new UserAdminError(409, code, "A user with this email already exists.");
  }

  if (code === "auth/invalid-email") {
    return new UserAdminError(400, code, "Invalid email address.");
  }

  if (code === "auth/invalid-password" || code === "auth/weak-password") {
    return new UserAdminError(400, code, "Password does not meet security requirements.");
  }

  console.error("Firebase Auth admin error:", error);
  return new UserAdminError(500, code, "Authentication service error. Try again later.");
}

export async function countActiveAdmins(excludeUid?: string): Promise<number> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.users)
    .where("role", "==", "admin")
    .where("active", "==", true)
    .get();

  return snapshot.docs.filter((doc) => doc.id !== excludeUid).length;
}

export async function ensureNotLastAdmin(
  targetUid: string,
  nextRole: string,
  nextActive: boolean
): Promise<void> {
  const snapshot = await adminDb.collection(COLLECTIONS.users).doc(targetUid).get();
  const currentRole = snapshot.data()?.role;
  const currentActive = snapshot.data()?.active === true;

  const removingAdmin =
    currentRole === "admin" &&
    currentActive &&
    (nextRole !== "admin" || !nextActive);

  if (!removingAdmin) return;

  const remaining = await countActiveAdmins(targetUid);
  if (remaining === 0) {
    throw new UserAdminError(
      400,
      "last_admin",
      "Cannot remove or demote the last active administrator."
    );
  }
}

export async function createFirebaseAuthUserWithEmail(params: {
  email: string;
  password: string;
  displayName: string | null;
  active: boolean;
}): Promise<UserRecord> {
  try {
    return await adminAuth.createUser({
      email: params.email,
      password: params.password,
      displayName: params.displayName ?? undefined,
      disabled: !params.active,
    });
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function setAuthUserDisabled(uid: string, disabled: boolean): Promise<void> {
  try {
    await adminAuth.updateUser(uid, { disabled });
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function deleteFirebaseAuthUser(uid: string): Promise<void> {
  try {
    await adminAuth.deleteUser(uid);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "auth/user-not-found") return;
    throw mapAuthError(error);
  }
}

export async function updateAuthUserProfile(
  uid: string,
  updates: { displayName?: string; disabled?: boolean }
): Promise<void> {
  try {
    await adminAuth.updateUser(uid, updates);
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function setTemporaryPassword(uid: string, password: string): Promise<void> {
  try {
    await adminAuth.updateUser(uid, { password });
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function generatePasswordResetLink(email: string): Promise<string> {
  try {
    return await adminAuth.generatePasswordResetLink(email);
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function getAuthLastSignIn(uid: string): Promise<string | null> {
  try {
    const record = await adminAuth.getUser(uid);
    const lastSignIn = record.metadata.lastSignInTime;
    if (!lastSignIn) return null;
    const date = new Date(lastSignIn);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

function generateRandomPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 24; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

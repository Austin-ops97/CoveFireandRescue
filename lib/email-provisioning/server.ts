import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  CpanelError,
  buildDepartmentEmailAddress,
  cpanelAddEmailPop,
  cpanelResetEmailPassword,
  cpanelSupportsUnlimitedQuota,
  isCpanelConfigured,
} from "@/lib/cpanel/server";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { VerifiedServerUser } from "@/lib/auth/server";
import {
  writeDepartmentEmailAudit,
  writeDepartmentEmailPasswordResetAudit,
} from "@/lib/email-provisioning/audit";
import type { DepartmentEmailInput } from "@/lib/email-provisioning/validation";
import { toManagedUserProfile } from "@/lib/users/profile";
import type { EmailProvisioningStatus, ManagedUserProfile } from "@/lib/users/types";
import { getAuthLastSignIn } from "@/lib/users/admin-server";

export class EmailProvisioningError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "EmailProvisioningError";
    this.status = status;
    this.code = code;
  }
}

export type EmailProvisioningConfig = {
  configured: boolean;
  domain: string | null;
  quotaOptions: Array<{ value: number; label: string }>;
  supportsUnlimited: boolean;
};

export async function getEmailProvisioningConfig(): Promise<EmailProvisioningConfig> {
  const configured = isCpanelConfigured();
  const domain = configured ? process.env.CPANEL_EMAIL_DOMAIN?.trim() ?? null : null;
  const supportsUnlimited = configured ? await cpanelSupportsUnlimitedQuota() : false;

  const quotaOptions: EmailProvisioningConfig["quotaOptions"] = [
    { value: 1024, label: "1024 MB" },
    { value: 2048, label: "2048 MB" },
    { value: 5120, label: "5120 MB" },
  ];

  if (supportsUnlimited) {
    quotaOptions.push({ value: 0, label: "Unlimited" });
  }

  return {
    configured,
    domain,
    quotaOptions,
    supportsUnlimited,
  };
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

async function loadManagedUser(uid: string): Promise<ManagedUserProfile | null> {
  const doc = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!doc.exists) return null;
  const lastLoginAt = await getAuthLastSignIn(uid);
  return toManagedUserProfile(uid, doc.data() ?? {}, lastLoginAt);
}

export async function provisionDepartmentEmailForUser(
  uid: string,
  input: DepartmentEmailInput,
  actor: VerifiedServerUser
): Promise<{
  user: ManagedUserProfile;
  emailAddress: string;
  message: string;
}> {
  if (!isCpanelConfigured()) {
    throw new EmailProvisioningError(
      503,
      "cpanel_not_configured",
      "Department email provisioning is not configured on this server."
    );
  }

  const existing = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!existing.exists) {
    throw new EmailProvisioningError(404, "user_not_found", "User profile not found.");
  }

  const currentStatus = readEmailProvisioningStatus(existing.data()?.emailProvisioningStatus);
  const currentEmail =
    typeof existing.data()?.departmentEmail === "string"
      ? existing.data()!.departmentEmail
      : null;

  if (currentStatus === "provisioned" && currentEmail) {
    throw new EmailProvisioningError(
      409,
      "email_already_provisioned",
      "This user already has a department email account."
    );
  }

  const emailAddress = buildDepartmentEmailAddress(input.emailUsername);
  const docRef = adminDb.collection(COLLECTIONS.users).doc(uid);

  await docRef.update({
    emailProvisioningStatus: "pending",
    emailProvisioningError: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    await cpanelAddEmailPop(input.emailUsername, input.password, input.quotaMb);

    await docRef.update({
      departmentEmail: emailAddress,
      departmentEmailUsername: input.emailUsername,
      emailProvisioningStatus: "provisioned",
      emailProvisioningError: null,
      departmentEmailQuotaMb: input.quotaMb,
      departmentEmailProvisionedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeDepartmentEmailAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      emailAddress,
      result: "success",
    });

    const user = await loadManagedUser(uid);
    if (!user) {
      throw new EmailProvisioningError(500, "profile_missing", "User profile could not be loaded.");
    }

    return {
      user,
      emailAddress,
      message: "Department email provisioned successfully.",
    };
  } catch (error) {
    const errorSummary =
      error instanceof CpanelError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown email provisioning error.";

    await docRef.update({
      emailProvisioningStatus: "failed",
      emailProvisioningError: errorSummary,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeDepartmentEmailAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      emailAddress,
      result: "failed",
      errorSummary,
    });

    if (error instanceof CpanelError) {
      throw new EmailProvisioningError(error.status, error.code, error.message);
    }

    console.error("Department email provisioning failed:", error);
    throw new EmailProvisioningError(
      502,
      "email_provisioning_failed",
      "Department email could not be created. Please try again later."
    );
  }
}

export async function resetDepartmentEmailPasswordForUser(
  uid: string,
  password: string,
  confirmPassword: string,
  actor: VerifiedServerUser
): Promise<{ message: string }> {
  if (password !== confirmPassword) {
    throw new EmailProvisioningError(
      400,
      "password_mismatch",
      "Password and confirm password must match."
    );
  }

  if (!isCpanelConfigured()) {
    throw new EmailProvisioningError(
      503,
      "cpanel_not_configured",
      "Department email provisioning is not configured on this server."
    );
  }

  const existing = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!existing.exists) {
    throw new EmailProvisioningError(404, "user_not_found", "User profile not found.");
  }

  const status = readEmailProvisioningStatus(existing.data()?.emailProvisioningStatus);
  const emailUsername =
    typeof existing.data()?.departmentEmailUsername === "string"
      ? existing.data()!.departmentEmailUsername
      : null;
  const departmentEmail =
    typeof existing.data()?.departmentEmail === "string"
      ? existing.data()!.departmentEmail
      : null;

  if (status !== "provisioned" || !emailUsername || !departmentEmail) {
    throw new EmailProvisioningError(
      400,
      "email_not_provisioned",
      "This user does not have a provisioned department email account."
    );
  }

  try {
    await cpanelResetEmailPassword(emailUsername, password);

    await writeDepartmentEmailPasswordResetAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      emailAddress: departmentEmail,
      result: "success",
    });

    return { message: "Department email password reset successfully." };
  } catch (error) {
    const errorSummary =
      error instanceof CpanelError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown password reset error.";

    await writeDepartmentEmailPasswordResetAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: uid,
      emailAddress: departmentEmail,
      result: "failed",
      errorSummary,
    });

    if (error instanceof CpanelError) {
      throw new EmailProvisioningError(error.status, error.code, error.message);
    }

    console.error("Department email password reset failed:", error);
    throw new EmailProvisioningError(
      502,
      "email_password_reset_failed",
      "Department email password could not be reset. Please try again later."
    );
  }
}

export function mapEmailProvisioningError(error: unknown): Response | null {
  if (!(error instanceof EmailProvisioningError)) return null;

  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status }
  );
}

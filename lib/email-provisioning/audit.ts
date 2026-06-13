import "server-only";

import { writeAuditLog } from "@/lib/audit/server";
import type { UserRole } from "@/lib/auth/roles";

type EmailAuditParams = {
  actorUid: string;
  actorRole: UserRole;
  targetUserId: string;
  emailAddress: string;
  result: "success" | "failed";
  errorSummary?: string | null;
};

type EmailFailureAuditParams = {
  actorUid: string;
  actorRole: UserRole;
  targetUserId: string;
  emailAddress: string;
  errorSummary?: string | null;
};

export async function writeDepartmentEmailAudit(params: EmailAuditParams): Promise<void> {
  const resultLabel = params.result === "success" ? "success" : "failed";
  const errorPart =
    params.result === "failed" && params.errorSummary
      ? ` — ${params.errorSummary}`
      : "";

  await writeAuditLog({
    action: "department_email_created",
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    targetType: "user",
    targetId: params.targetUserId,
    message: `Department email ${params.emailAddress} (${resultLabel})${errorPart}`,
  });
}

export async function writeEmailCreationFailedAudit(
  params: EmailFailureAuditParams
): Promise<void> {
  const errorPart = params.errorSummary ? ` — ${params.errorSummary}` : "";

  await writeAuditLog({
    action: "email_creation_failed",
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    targetType: "user",
    targetId: params.targetUserId,
    message: `Department email creation failed for ${params.emailAddress}${errorPart}`,
  });
}

export async function writePortalUserCreatedAudit(params: EmailAuditParams): Promise<void> {
  const resultLabel = params.result === "success" ? "success" : "failed";

  await writeAuditLog({
    action: "portal_user_created",
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    targetType: "user",
    targetId: params.targetUserId,
    message: `Portal user created for ${params.emailAddress} (${resultLabel})`,
  });
}

export async function writePortalUserCreationFailedAudit(
  params: EmailFailureAuditParams
): Promise<void> {
  const errorPart = params.errorSummary ? ` — ${params.errorSummary}` : "";

  await writeAuditLog({
    action: "portal_user_creation_failed",
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    targetType: "user",
    targetId: params.targetUserId,
    message: `Portal user creation failed for ${params.emailAddress}${errorPart}`,
  });
}

type DepartmentEmailPasswordResetAuditParams = {
  actorUid: string;
  actorRole: UserRole;
  targetUserId: string;
  emailAddress: string;
  result: "success" | "failed";
  errorSummary?: string | null;
};

export async function writeDepartmentEmailPasswordResetAudit(
  params: DepartmentEmailPasswordResetAuditParams
): Promise<void> {
  const resultLabel = params.result === "success" ? "success" : "failed";
  const errorPart =
    params.result === "failed" && params.errorSummary
      ? ` — ${params.errorSummary}`
      : "";

  await writeAuditLog({
    action: "department_email_password_reset",
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    targetType: "user",
    targetId: params.targetUserId,
    message: `Department email password reset for ${params.emailAddress} (${resultLabel})${errorPart}`,
  });
}

export async function writePasswordResetRequestedAudit(params: {
  actorUid: string;
  actorRole: UserRole;
  targetUserId: string;
  emailAddress: string | null;
  result: "success" | "failed";
  errorSummary?: string | null;
}): Promise<void> {
  const emailPart = params.emailAddress ?? "unknown email";
  const resultLabel = params.result === "success" ? "success" : "failed";
  const errorPart =
    params.result === "failed" && params.errorSummary
      ? ` — ${params.errorSummary}`
      : "";

  await writeAuditLog({
    action: "password_reset_requested",
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    targetType: "user",
    targetId: params.targetUserId,
    message: `Portal password reset requested for ${emailPart} (${resultLabel})${errorPart}`,
  });
}

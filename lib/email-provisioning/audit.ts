import "server-only";

import { writeAuditLog } from "@/lib/audit/server";
import type { UserRole } from "@/lib/auth/roles";

type DepartmentEmailAuditParams = {
  actorUid: string;
  actorRole: UserRole;
  targetUserId: string;
  emailAddress: string;
  result: "success" | "failed";
  errorSummary?: string | null;
};

export async function writeDepartmentEmailAudit(
  params: DepartmentEmailAuditParams
): Promise<void> {
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

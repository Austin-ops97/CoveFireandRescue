import "server-only";

import { writeAuditLog } from "@/lib/audit/server";
import type { AuditAction } from "@/lib/audit/types";
import type { UserRole } from "@/lib/auth/roles";

type UserAuditParams = {
  action: AuditAction;
  actorUid: string;
  actorRole: UserRole;
  targetUserId: string;
  targetUserEmail: string | null;
  details?: string;
};

export async function writeUserManagementAudit(params: UserAuditParams): Promise<void> {
  const emailPart = params.targetUserEmail ? ` (${params.targetUserEmail})` : "";
  const message = params.details
    ? `${params.details}${emailPart}`
    : `${params.action} for user ${params.targetUserId}${emailPart}`;

  await writeAuditLog({
    action: params.action,
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    targetType: "user",
    targetId: params.targetUserId,
    message,
  });
}

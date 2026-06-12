export type AuditAction =
  | "user.profile.created"
  | "user.profile.updated"
  | "storage.upload.requested"
  | "storage.upload.completed"
  | "storage.upload.failed"
  | "storage.file.deleted"
  | "checklist.template.created"
  | "checklist.template.updated"
  | "checklist.template.archived"
  | "checklist.submission.created"
  | "announcement.created"
  | "announcement.updated"
  | "announcement.deleted"
  | "announcement.published"
  | "announcement.archived"
  | "fleet.created"
  | "fleet.updated"
  | "fleet.archived"
  | "leadership.created"
  | "leadership.updated"
  | "leadership.archived";

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  actorUid: string;
  actorRole: "admin" | "member";
  targetType?: string;
  targetId?: string;
  message?: string;
  createdAt: unknown;
};

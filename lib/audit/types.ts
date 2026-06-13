export type AuditAction =
  | "user.profile.created"
  | "user.profile.updated"
  | "user.created"
  | "user.updated"
  | "user.disabled"
  | "user.deleted"
  | "user.role_changed"
  | "user.password_reset"
  | "department_email_created"
  | "department_email_password_reset"
  | "storage.upload.requested"
  | "storage.upload.completed"
  | "storage.upload.failed"
  | "storage.file.deleted"
  | "file_storage.folder.created"
  | "file_storage.folder.renamed"
  | "file_storage.folder.moved"
  | "file_storage.folder.deleted"
  | "file_storage.file.uploaded"
  | "file_storage.file.renamed"
  | "file_storage.file.moved"
  | "file_storage.file.deleted"
  | "file_storage.migrate"
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
  actorRole: "admin" | "editor" | "viewer" | "member";
  targetType?: string;
  targetId?: string;
  message?: string;
  createdAt: unknown;
};

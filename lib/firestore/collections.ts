export const COLLECTIONS = {
  users: "users",
  announcements: "announcements",
  fleet: "fleet",
  leadership: "leadership",
  checklistTemplates: "checklistTemplates",
  checklistSubmissions: "checklistSubmissions",
  files: "files",
  auditLogs: "auditLogs",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const userDocPath = (uid: string): string => `${COLLECTIONS.users}/${uid}`;

export const announcementDocPath = (id: string): string =>
  `${COLLECTIONS.announcements}/${id}`;

export const fleetDocPath = (id: string): string => `${COLLECTIONS.fleet}/${id}`;

export const leadershipDocPath = (id: string): string =>
  `${COLLECTIONS.leadership}/${id}`;

export const checklistTemplateDocPath = (id: string): string =>
  `${COLLECTIONS.checklistTemplates}/${id}`;

export const checklistSubmissionDocPath = (id: string): string =>
  `${COLLECTIONS.checklistSubmissions}/${id}`;

export const fileDocPath = (id: string): string => `${COLLECTIONS.files}/${id}`;

export const auditLogDocPath = (id: string): string =>
  `${COLLECTIONS.auditLogs}/${id}`;

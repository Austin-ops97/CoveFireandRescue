export const COLLECTIONS = {
  users: "users",
  announcements: "announcements",
  applications: "applications",
  contactSubmissions: "contactSubmissions",
  gallery: "gallery",
  fleet: "fleet",
  leadership: "leadership",
  checklistTemplates: "checklistTemplates",
  checklistSubmissions: "checklistSubmissions",
  checklistNotifications: "checklistNotifications",
  files: "files",
  trainingRecords: "trainingRecords",
  equipment: "equipment",
  requestTickets: "requestTickets",
  auditLogs: "auditLogs",
  storageFolders: "storageFolders",
  storageFiles: "storageFiles",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const userDocPath = (uid: string): string => `${COLLECTIONS.users}/${uid}`;

export const announcementDocPath = (id: string): string =>
  `${COLLECTIONS.announcements}/${id}`;

export const applicationDocPath = (id: string): string =>
  `${COLLECTIONS.applications}/${id}`;

export const contactSubmissionDocPath = (id: string): string =>
  `${COLLECTIONS.contactSubmissions}/${id}`;

export const galleryDocPath = (id: string): string => `${COLLECTIONS.gallery}/${id}`;

export const fleetDocPath = (id: string): string => `${COLLECTIONS.fleet}/${id}`;

export const leadershipDocPath = (id: string): string =>
  `${COLLECTIONS.leadership}/${id}`;

export const checklistTemplateDocPath = (id: string): string =>
  `${COLLECTIONS.checklistTemplates}/${id}`;

export const checklistSubmissionDocPath = (id: string): string =>
  `${COLLECTIONS.checklistSubmissions}/${id}`;

export const checklistNotificationDocPath = (id: string): string =>
  `${COLLECTIONS.checklistNotifications}/${id}`;

export const fileDocPath = (id: string): string => `${COLLECTIONS.files}/${id}`;

export const trainingRecordDocPath = (id: string): string =>
  `${COLLECTIONS.trainingRecords}/${id}`;

export const equipmentDocPath = (id: string): string => `${COLLECTIONS.equipment}/${id}`;

export const requestTicketDocPath = (id: string): string =>
  `${COLLECTIONS.requestTickets}/${id}`;

export const auditLogDocPath = (id: string): string =>
  `${COLLECTIONS.auditLogs}/${id}`;

export const storageFolderDocPath = (id: string): string =>
  `${COLLECTIONS.storageFolders}/${id}`;

export const storageFileDocPath = (id: string): string =>
  `${COLLECTIONS.storageFiles}/${id}`;

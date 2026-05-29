export type FirestoreTimestamp = unknown;

export type AnnouncementCategory =
  | "community_notice"
  | "training"
  | "burn_ban"
  | "event"
  | "department_update"
  | "general";

export type AnnouncementStatus = "draft" | "published" | "archived";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinned: boolean;
  imageFileIds: string[];
  createdBy: string;
  createdByName?: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  publishedAt?: FirestoreTimestamp;
};

export type FleetUnitStatus = "active" | "inactive" | "archived";

export type FleetUnit = {
  id: string;
  name: string;
  unitNumber: string;
  type: string;
  year: string;
  manufacturer: string;
  model?: string | null;
  pumpCapacityGpm?: number | null;
  waterCapacityGallons?: number | null;
  equipmentNotes: string;
  imageFileIds: string[];
  status: FleetUnitStatus;
  active: boolean;
  sortOrder: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type LeadershipMemberStatus = "active" | "inactive" | "archived";

export type LeadershipMember = {
  id: string;
  name: string;
  rank: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  bio: string;
  photoFileId?: string | null;
  status: LeadershipMemberStatus;
  active: boolean;
  sortOrder: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type ChecklistTemplateScope = "fleet" | "station" | "equipment" | "general";

export type ChecklistFieldType =
  | "pass_fail"
  | "pass_fail_na"
  | "yes_no"
  | "checkbox"
  | "text"
  | "number"
  | "select"
  | "photo"
  | "signature";

export type ChecklistTemplateField = {
  id: string;
  label: string;
  type: ChecklistFieldType;
  required: boolean;
  sortOrder: number;
  options?: string[];
  helpText?: string | null;
};

export type ChecklistTemplateSection = {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  fields: ChecklistTemplateField[];
};

export type ChecklistTemplate = {
  id: string;
  name: string;
  description?: string | null;
  scope: ChecklistTemplateScope;
  active: boolean;
  reusable: boolean;
  sortOrder: number;
  sections: ChecklistTemplateSection[];
  createdAt: unknown;
  updatedAt: unknown;
};

export type ChecklistSubmissionAnswer = {
  fieldId: string;
  sectionId: string;
  value: string | boolean | number | string[] | null;
  photoFileIds?: string[];
};

export type ChecklistSubmission = {
  id: string;
  templateId: string;
  templateName: string;
  scope: ChecklistTemplateScope;
  relatedFleetUnitId?: string | null;
  relatedFleetUnitName?: string | null;
  submittedBy: string;
  submittedByName?: string | null;
  notes?: string;
  answers: ChecklistSubmissionAnswer[];
  photoFileIds: string[];
  submittedAt: unknown;
};

export type StoredFileModule =
  | "announcements"
  | "fleet"
  | "rounds"
  | "leadership"
  | "documents";

export type StoredFileMetadata = {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  b2FileId: string;
  b2Key: string;
  publicUrl: string;
  uploadedBy: string;
  uploadedByName?: string | null;
  uploadedAt: unknown;
  module: StoredFileModule;
  relatedId?: string | null;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  actorUid: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  message: string;
  createdAt: FirestoreTimestamp;
};

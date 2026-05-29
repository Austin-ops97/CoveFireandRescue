export type AnnouncementCategory =
  | "community_notice"
  | "training"
  | "burn_ban"
  | "event"
  | "department_update"
  | "general";

export type AnnouncementStatus = "draft" | "published" | "archived";

export type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinned: boolean;
  imageFileIds: string[];
  createdBy: string;
  createdByName?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  publishedAt?: unknown;
};

export type AnnouncementFormState = {
  id?: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinned: boolean;
};

export const ANNOUNCEMENT_CATEGORIES: Array<{
  value: AnnouncementCategory;
  label: string;
}> = [
  { value: "community_notice", label: "Community Notice" },
  { value: "training", label: "Training" },
  { value: "burn_ban", label: "Burn Ban" },
  { value: "event", label: "Event" },
  { value: "department_update", label: "Department Update" },
  { value: "general", label: "General" },
];

export const ANNOUNCEMENT_STATUSES: Array<{
  value: AnnouncementStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function getCategoryLabel(category: AnnouncementCategory): string {
  return ANNOUNCEMENT_CATEGORIES.find((item) => item.value === category)?.label ?? "General";
}

export function getStatusLabel(status: AnnouncementStatus): string {
  return ANNOUNCEMENT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

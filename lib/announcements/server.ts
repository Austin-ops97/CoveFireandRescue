import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type {
  AnnouncementCategory,
  AnnouncementRecord,
  AnnouncementStatus,
} from "@/lib/announcements/types";

const VALID_CATEGORIES: AnnouncementCategory[] = [
  "community_notice",
  "training",
  "burn_ban",
  "event",
  "department_update",
  "general",
];

const VALID_STATUSES: AnnouncementStatus[] = ["draft", "published", "archived"];

export class AnnouncementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnnouncementValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readCategory(value: unknown): AnnouncementCategory {
  if (typeof value === "string" && VALID_CATEGORIES.includes(value as AnnouncementCategory)) {
    return value as AnnouncementCategory;
  }
  return "general";
}

function readStatus(value: unknown): AnnouncementStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as AnnouncementStatus)) {
    return value as AnnouncementStatus;
  }
  return "draft";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function serializeAnnouncementDoc(doc: DocumentSnapshot): AnnouncementRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : "",
    body: typeof data.body === "string" ? data.body : "",
    category: readCategory(data.category),
    status: readStatus(data.status),
    pinned: data.pinned === true,
    imageFileIds: readStringArray(data.imageFileIds),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdByName:
      typeof data.createdByName === "string"
        ? data.createdByName
        : data.createdByName === null
          ? null
          : null,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    publishedAt: data.publishedAt !== undefined ? serializeTimestamp(data.publishedAt) : undefined,
  };
}

export function validateAnnouncementPayload(input: unknown): {
  title: string;
  body: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinned: boolean;
} {
  if (!input || typeof input !== "object") {
    throw new AnnouncementValidationError("Invalid announcement payload.");
  }

  const payload = input as Record<string, unknown>;

  if (typeof payload.title !== "string" || !payload.title.trim()) {
    throw new AnnouncementValidationError("Title is required.");
  }

  const title = payload.title.trim();
  if (title.length > 140) {
    throw new AnnouncementValidationError("Title must be 140 characters or fewer.");
  }

  if (typeof payload.body !== "string" || !payload.body.trim()) {
    throw new AnnouncementValidationError("Body is required.");
  }

  const body = payload.body.trim();
  if (body.length > 5000) {
    throw new AnnouncementValidationError("Body must be 5000 characters or fewer.");
  }

  if (
    typeof payload.category !== "string" ||
    !VALID_CATEGORIES.includes(payload.category as AnnouncementCategory)
  ) {
    throw new AnnouncementValidationError("Category is invalid.");
  }

  if (
    typeof payload.status !== "string" ||
    !VALID_STATUSES.includes(payload.status as AnnouncementStatus)
  ) {
    throw new AnnouncementValidationError("Status must be draft, published, or archived.");
  }

  if (typeof payload.pinned !== "boolean") {
    throw new AnnouncementValidationError("Pinned must be a boolean.");
  }

  return {
    title,
    body,
    category: payload.category as AnnouncementCategory,
    status: payload.status as AnnouncementStatus,
    pinned: payload.pinned,
  };
}

export function announcementSortTime(record: AnnouncementRecord): number {
  const value = record.publishedAt ?? record.updatedAt ?? record.createdAt;
  if (typeof value === "string") {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  return 0;
}

export function sortAnnouncementsForDisplay(
  announcements: AnnouncementRecord[]
): AnnouncementRecord[] {
  return [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return announcementSortTime(b) - announcementSortTime(a);
  });
}
